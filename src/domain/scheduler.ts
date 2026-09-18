import type { Exercise, ProgramPhase, Routine, Settings, Workout } from '@/db/types'
import { addDays, startOfWeek, weekday } from './dates'

export interface PlanInputs {
  today: string
  now: number
  settings: Settings
  phase: ProgramPhase | undefined
  routinesById: Record<string, Routine>
  /** Finished workouts, any order. */
  workouts: Workout[]
}

export interface TodayPlan {
  kind: 'done' | 'train' | 'rest' | 'none'
  routineId: string | null
  routine: Routine | null
  /** Next training date when resting (or today when training). */
  nextDate: string | null
  hoursSinceLast: number | null
  warn48h: boolean
  doneWorkout: Workout | null
  overridden: boolean
}

export type DayStatus = 'done' | 'missed' | 'planned' | 'rest'

export interface WeekDay {
  date: string
  weekday: number
  isToday: boolean
  status: DayStatus
  label: string | null
  routineId: string | null
}

function lastCompletedInPhase(workouts: Workout[], phase: ProgramPhase | undefined): Workout | null {
  if (!phase) return null
  const ids = new Set(phase.routineIds)
  let best: Workout | null = null
  for (const w of workouts) {
    if (!w.finishedAt || !w.routineId || !ids.has(w.routineId)) continue
    if (!best || w.startedAt > best.startedAt) best = w
  }
  return best
}

/** Next routine in the rotation; a one-off override wins. */
export function nextRoutineId(
  phase: ProgramPhase | undefined,
  lastCompletedRoutineId: string | null,
  overrideRoutineId: string | null,
): string | null {
  if (overrideRoutineId) return overrideRoutineId
  if (!phase || phase.routineIds.length === 0) return null
  if (!lastCompletedRoutineId) return phase.routineIds[0]
  const i = phase.routineIds.indexOf(lastCompletedRoutineId)
  if (i === -1) return phase.routineIds[0]
  return phase.routineIds[(i + 1) % phase.routineIds.length]
}

function routineAfter(phase: ProgramPhase, routineId: string | null): string {
  if (!routineId) return phase.routineIds[0]
  const i = phase.routineIds.indexOf(routineId)
  return phase.routineIds[(i + 1) % phase.routineIds.length]
}

function isTrainingDay(date: string, settings: Settings, phase: ProgramPhase | undefined): boolean {
  const wd = weekday(date)
  if (phase?.pinnedWeekdays) return phase.pinnedWeekdays[wd] !== undefined
  return settings.trainingDays.includes(wd)
}

function nextTrainingDate(from: string, settings: Settings, phase: ProgramPhase | undefined): string | null {
  for (let i = 1; i <= 14; i += 1) {
    const d = addDays(from, i)
    if (isTrainingDay(d, settings, phase)) return d
  }
  return null
}

export function todayPlan(input: PlanInputs): TodayPlan {
  const { today, now, settings, phase, routinesById, workouts } = input
  const doneToday = workouts.find((w) => w.finishedAt && w.localDate === today && w.routineId && routinesById[w.routineId]?.kind === 'main') ?? null
  const last = lastCompletedInPhase(workouts, phase)
  const hoursSinceLast = last?.finishedAt ? (now - last.finishedAt) / 3_600_000 : null

  const overridden = Boolean(settings.nextOverrideRoutineId)

  if (doneToday) {
    return {
      kind: 'done',
      routineId: doneToday.routineId,
      routine: doneToday.routineId ? routinesById[doneToday.routineId] ?? null : null,
      nextDate: nextTrainingDate(today, settings, phase),
      hoursSinceLast,
      warn48h: false,
      doneWorkout: doneToday,
      overridden,
    }
  }
  if (!phase || phase.routineIds.length === 0) {
    return { kind: 'none', routineId: null, routine: null, nextDate: null, hoursSinceLast, warn48h: false, doneWorkout: null, overridden }
  }
  const training = isTrainingDay(today, settings, phase)
  if (phase.pinnedWeekdays && !training) {
    const nd = nextTrainingDate(today, settings, phase)
    const rid = nd ? phase.pinnedWeekdays[weekday(nd)] ?? null : null
    return { kind: 'rest', routineId: rid, routine: rid ? routinesById[rid] ?? null : null, nextDate: nd, hoursSinceLast, warn48h: false, doneWorkout: null, overridden }
  }
  const routineId = phase.pinnedWeekdays
    ? settings.nextOverrideRoutineId ?? phase.pinnedWeekdays[weekday(today)] ?? null
    : nextRoutineId(phase, last?.routineId ?? null, settings.nextOverrideRoutineId)
  if (!routineId) {
    return { kind: 'none', routineId: null, routine: null, nextDate: null, hoursSinceLast, warn48h: false, doneWorkout: null, overridden }
  }
  return {
    kind: training ? 'train' : 'rest',
    routineId,
    routine: routinesById[routineId] ?? null,
    nextDate: training ? today : nextTrainingDate(today, settings, phase),
    hoursSinceLast,
    warn48h: training && hoursSinceLast !== null && hoursSinceLast < 48,
    doneWorkout: null,
    overridden,
  }
}

/** Seven days of the current week with what happened or what is projected. */
export function weekStrip(input: PlanInputs): WeekDay[] {
  const { today, settings, phase, routinesById, workouts } = input
  const start = startOfWeek(today, settings.weekStartsOn)
  const last = lastCompletedInPhase(workouts, phase)
  const byDate = new Map<string, Workout>()
  let firstDate: string | null = null
  for (const w of workouts) {
    if (!w.finishedAt) continue
    if (firstDate === null || w.localDate < firstDate) firstDate = w.localDate
    const existing = byDate.get(w.localDate)
    const isMain = w.routineId ? routinesById[w.routineId]?.kind === 'main' : false
    const existingMain = existing?.routineId ? routinesById[existing.routineId]?.kind === 'main' : false
    if (!existing || (isMain && !existingMain)) byDate.set(w.localDate, w)
  }
  // Projection cursor continues from the last completed routine, but only for
  // days from today onward; earlier days show history only.
  let cursor: string | null = null
  if (phase && !phase.pinnedWeekdays) {
    cursor = nextRoutineId(phase, last?.routineId ?? null, settings.nextOverrideRoutineId)
  }
  const days: WeekDay[] = []
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(start, i)
    const wd = weekday(date)
    const done = byDate.get(date)
    const training = isTrainingDay(date, settings, phase)
    if (done) {
      const r = done.routineId ? routinesById[done.routineId] : undefined
      days.push({ date, weekday: wd, isToday: date === today, status: 'done', label: r?.shortLabel ?? done.routineName ?? done.title, routineId: done.routineId })
      continue
    }
    if (!training) {
      days.push({ date, weekday: wd, isToday: date === today, status: 'rest', label: null, routineId: null })
      continue
    }
    if (date < today) {
      // A skipped training day only counts as missed once the program has started.
      const missed = firstDate !== null && date >= firstDate
      days.push({ date, weekday: wd, isToday: false, status: missed ? 'missed' : 'rest', label: null, routineId: null })
      continue
    }
    let rid: string | null = null
    if (phase?.pinnedWeekdays) {
      rid = phase.pinnedWeekdays[wd] ?? null
    } else if (phase && cursor) {
      rid = cursor
      cursor = routineAfter(phase, cursor)
    }
    days.push({ date, weekday: wd, isToday: date === today, status: 'planned', label: rid ? routinesById[rid]?.shortLabel ?? routinesById[rid]?.name ?? null : null, routineId: rid })
  }
  return days
}

/** How many sessions this week hit a muscle group, and whether more are due. */
export function weeklyMuscleSessions(
  workouts: Workout[],
  exercisesById: Record<string, Exercise>,
  muscle: Exercise['muscleGroup'],
  today: string,
  weekStartsOn: 0 | 1,
  target: number,
): { done: number; target: number; due: boolean } {
  const start = startOfWeek(today, weekStartsOn)
  const end = addDays(start, 6)
  const dates = new Set<string>()
  for (const w of workouts) {
    if (!w.finishedAt || w.localDate < start || w.localDate > end) continue
    const hits = w.exercises.some((e) => exercisesById[e.exerciseId]?.muscleGroup === muscle && e.sets.some((s) => s.completed))
    if (hits) dates.add(w.localDate)
  }
  return { done: dates.size, target, due: dates.size < target }
}

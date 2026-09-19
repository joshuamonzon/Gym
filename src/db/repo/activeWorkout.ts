import { db } from '../db'
import type { ActiveWorkout, Exercise, ExerciseProgress, RestTimerState, Routine, Scheme, SetPrescription, Workout, WorkoutExercise } from '../types'
import { buildWorkoutDraft, buildWorkoutExercise, workingWeightFor, type DraftInputs } from '@/domain/buildWorkoutDraft'
import { rptSets, straightSets, restPauseSets, timedSets } from '../seed/routines'
import { finalizeWorkout, pruneIncomplete, topSetWeightLb } from '@/domain/workoutMath'
import { flagPrs } from '@/domain/prs'
import { suggestProgression, type ProgressionSuggestion } from '@/domain/progression'
import { completeSet, type SetFill } from '@/domain/workoutEdit'
import { completedSetCount } from '@/domain/volume'
import { defaultSettings } from '../seed'
import { lastWorkoutForExercise, workoutsForExercise } from './workouts'
import { latestBodyweightLb } from './measurements'

export function getActiveWorkout() {
  return db.activeWorkout.get('current')
}

/** The last logged block per exercise (for the PREVIOUS column and pre-fills). */
export async function lastExerciseBlocks(exerciseIds: string[], excludeWorkoutId?: string): Promise<Record<string, WorkoutExercise | undefined>> {
  const out: Record<string, WorkoutExercise | undefined> = {}
  await Promise.all(
    Array.from(new Set(exerciseIds)).map(async (id) => {
      const w = await lastWorkoutForExercise(id, excludeWorkoutId)
      out[id] = w?.exercises.find((e) => e.exerciseId === id && e.sets.some((s) => s.completed))
    }),
  )
  return out
}

async function draftInputs(routine: Routine | null, now: number, exerciseIds: string[]): Promise<DraftInputs> {
  const [exercises, progress, settings, programs] = await Promise.all([
    db.exercises.toArray(),
    db.exerciseProgress.toArray(),
    db.settings.get('app'),
    db.programs.toArray(),
  ])
  const s = settings ?? defaultSettings(now)
  const exercisesById: Record<string, Exercise> = {}
  for (const e of exercises) exercisesById[e.id] = e
  const progressById: Record<string, ExerciseProgress> = {}
  for (const p of progress) progressById[p.exerciseId] = p
  const blocks = await lastExerciseBlocks(exerciseIds)
  const lastTopSetLb: Record<string, number | null> = {}
  for (const id of exerciseIds) lastTopSetLb[id] = blocks[id] ? topSetWeightLb(blocks[id]!) : null
  const program = programs.find((p) => p.id === s.activeProgramId)
  const phase = program?.phases.find((p) => p.id === s.activePhaseId)
  return { routine, exercisesById, progressById, lastTopSetLb, settings: s, phase, now }
}

/** Start a workout from a routine (or an empty one). Returns the existing draft if one is active. */
export async function startWorkout(routineId: string | null, now = Date.now()): Promise<Workout> {
  const existing = await db.activeWorkout.get('current')
  if (existing) return existing.draft
  const routine = routineId ? (await db.routines.get(routineId)) ?? null : null
  const input = await draftInputs(routine, now, routine?.exercises.map((e) => e.exerciseId) ?? [])
  const draft = buildWorkoutDraft(input)
  await db.activeWorkout.put({ id: 'current', draft, restTimer: null })
  return draft
}

/** Append every exercise of a routine (abs, mobility, finishers) to the active workout. */
export async function appendRoutineToActive(routineId: string, now = Date.now()): Promise<void> {
  const routine = await db.routines.get(routineId)
  if (!routine) return
  const input = await draftInputs(routine, now, routine.exercises.map((e) => e.exerciseId))
  const built = buildWorkoutDraft({ ...input, phase: undefined })
  await updateActive((a) => ({
    ...a,
    draft: { ...a.draft, exercises: [...a.draft.exercises, ...built.exercises], exerciseIds: Array.from(new Set([...a.draft.exerciseIds, ...built.exerciseIds])) },
  }))
}

function defaultPrescriptions(scheme: Scheme, ex: Exercise): SetPrescription[] {
  switch (scheme) {
    case 'rpt':
      return rptSets()
    case 'rest_pause':
      return restPauseSets()
    case 'timed':
      return timedSets(3, ex.muscleGroup === 'mobility' ? 20 : 30)
    case 'straight':
      return straightSets(3, 8, 15)
    default:
      return straightSets(3, 8, 12)
  }
}

/** A fresh logged block for an exercise, used by "Add exercise" and "Swap". */
export async function buildExerciseBlock(exerciseId: string, scheme?: Scheme, now = Date.now()): Promise<WorkoutExercise> {
  const ex = await db.exercises.get(exerciseId)
  if (!ex) throw new Error('Exercise not found')
  const input = await draftInputs(null, now, [exerciseId])
  const sch = scheme ?? ex.defaultScheme
  const ww = workingWeightFor(ex.id, input.progressById, input.lastTopSetLb)
  const rest = sch === 'rest_pause' ? input.settings.restDefaults.restPause : ex.defaultRestSec
  return buildWorkoutExercise(ex, sch, defaultPrescriptions(sch, ex), rest, ww, input.settings)
}

/** Read-modify-write inside one transaction so rapid taps never lose updates. */
export async function updateActive(mutator: (a: ActiveWorkout) => ActiveWorkout): Promise<void> {
  await db.transaction('rw', db.activeWorkout, async () => {
    const a = await db.activeWorkout.get('current')
    if (!a) return
    await db.activeWorkout.put(mutator(a))
  })
}

export function mutateDraft(fn: (w: Workout) => Workout): Promise<void> {
  return updateActive((a) => ({ ...a, draft: fn(a.draft) }))
}

export async function discardWorkout(): Promise<void> {
  await db.activeWorkout.delete('current')
}

export function completeSetActive(weId: string, setId: string, fill: SetFill, now = Date.now()): Promise<void> {
  return updateActive((a) => {
    const draft = completeSet(a.draft, weId, setId, fill, now)
    const we = draft.exercises.find((e) => e.id === weId)
    const set = we?.sets.find((s) => s.id === setId)
    const restTimer: RestTimerState | null =
      set && set.restSec > 0
        ? { setId, exerciseId: weId, startedAt: now, endsAt: now + set.restSec * 1000, durationSec: set.restSec, fired: false }
        : null
    return { ...a, draft, restTimer }
  })
}

export function startRest(durationSec: number, now = Date.now()): Promise<void> {
  return updateActive((a) => ({
    ...a,
    restTimer: { setId: 'manual', exerciseId: '', startedAt: now, endsAt: now + durationSec * 1000, durationSec, fired: false },
  }))
}

export function adjustRest(deltaSec: number, now = Date.now()): Promise<void> {
  return updateActive((a) => {
    if (!a.restTimer) return a
    const endsAt = Math.max(now, a.restTimer.endsAt + deltaSec * 1000)
    return { ...a, restTimer: { ...a.restTimer, endsAt, durationSec: Math.max(0, a.restTimer.durationSec + deltaSec), fired: false } }
  })
}

export function skipRest(): Promise<void> {
  return updateActive((a) => ({ ...a, restTimer: null }))
}

export function markRestFired(): Promise<void> {
  return updateActive((a) => (a.restTimer ? { ...a, restTimer: { ...a.restTimer, fired: true } } : a))
}

export interface FinishSummary {
  workout: Workout
  setCount: number
  suggestions: ProgressionSuggestion[]
  prs: { exerciseName: string; weightLb: number | null; reps: number | null; kinds: string[] }[]
}

async function prepareFinal(draft: Workout, now: number): Promise<FinishSummary> {
  const exercises = await db.exercises.toArray()
  const byId: Record<string, Exercise> = {}
  for (const e of exercises) byId[e.id] = e
  const bw = await latestBodyweightLb()
  const pruned = pruneIncomplete({ ...draft, finishedAt: now })
  const ids = Array.from(new Set(pruned.exercises.map((e) => e.exerciseId)))
  const historyLists = await Promise.all(ids.map((id) => workoutsForExercise(id)))
  const seen = new Set<string>()
  const history: Workout[] = []
  for (const list of historyLists) for (const w of list) if (!seen.has(w.id)) { seen.add(w.id); history.push(w) }
  const flagged = finalizeWorkout(flagPrs(pruned, history, byId, bw))
  const suggestions = flagged.exercises
    .map((we) => suggestProgression(we, byId[we.exerciseId]))
    .filter((s): s is ProgressionSuggestion => s !== null)
  const prs: FinishSummary['prs'] = []
  for (const we of flagged.exercises) for (const s of we.sets) if (s.prs?.length) prs.push({ exerciseName: we.nameSnapshot, weightLb: s.weightLb, reps: s.reps, kinds: s.prs })
  return { workout: flagged, setCount: completedSetCount(flagged.exercises), suggestions, prs }
}

/** What the finish sheet shows before the user confirms. */
export async function summarizeActive(now = Date.now()): Promise<FinishSummary | null> {
  const a = await db.activeWorkout.get('current')
  if (!a) return null
  return prepareFinal(a.draft, now)
}

/** Save the active workout as history, update progression, clear the override and the draft. */
export async function finishWorkout(opts: { nextWeightOverrides?: Record<string, number | null>; now?: number } = {}): Promise<Workout> {
  const now = opts.now ?? Date.now()
  return db.transaction('rw', [db.activeWorkout, db.workouts, db.exerciseProgress, db.exercises, db.settings, db.measurements], async () => {
    const a = await db.activeWorkout.get('current')
    if (!a) throw new Error('No workout in progress')
    const summary = await prepareFinal(a.draft, now)
    const w = summary.workout
    await db.workouts.add(w)
    const rows: ExerciseProgress[] = summary.suggestions.map((s) => {
      const override = opts.nextWeightOverrides?.[s.exerciseId]
      return {
        exerciseId: s.exerciseId,
        workingWeightLb: s.currentLb,
        nextWorkingWeightLb: override === undefined ? s.nextLb : override,
        lastPerformedAt: now,
        updatedAt: now,
      }
    })
    if (rows.length) await db.exerciseProgress.bulkPut(rows)
    await db.settings.update('app', { nextOverrideRoutineId: null })
    await db.activeWorkout.delete('current')
    return w
  })
}

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Routine, Workout } from '@/db/types'
import { addDays, parseLocalDate, startOfWeek, toLocalDate } from '@/domain/dates'
import { todayPlan, weekStrip, weeklyMuscleSessions, type TodayPlan, type WeekDay } from '@/domain/scheduler'
import { useActiveProgram, useExercisesById, useRoutines } from './useData'
import { useNow } from './useNow'
import { useSettings } from './useSettings'

export interface TodayView {
  loading: boolean
  today: string
  plan: TodayPlan | null
  strip: WeekDay[]
  abs: { done: number; target: number; due: boolean }
  mobility: { done: number; target: number; due: boolean }
  routinesById: Record<string, Routine>
  phaseRoutines: Routine[]
}

export function useTodayPlan(): TodayView {
  const settings = useSettings()
  const now = useNow(60_000)
  const today = toLocalDate(now)
  const { phase } = useActiveProgram()
  const routines = useRoutines()
  const exercisesById = useExercisesById()
  const since = useMemo(() => parseLocalDate(addDays(startOfWeek(today, settings.weekStartsOn), -7 * 8)).getTime(), [today, settings.weekStartsOn])
  const recent = useLiveQuery(() => db.workouts.where('startedAt').aboveOrEqual(since).toArray(), [since])
  const phaseKey = phase?.routineIds.join(',') ?? ''
  const lastInPhase = useLiveQuery(async () => {
    if (!phaseKey) return undefined
    const ids = new Set(phaseKey.split(','))
    return db.workouts
      .orderBy('startedAt')
      .reverse()
      .filter((w) => Boolean(w.finishedAt && w.routineId && ids.has(w.routineId)))
      .first()
  }, [phaseKey])

  return useMemo(() => {
    const routinesById: Record<string, Routine> = {}
    for (const r of routines ?? []) routinesById[r.id] = r
    const loading = !routines || !recent
    const workouts: Workout[] = [...(recent ?? [])]
    if (lastInPhase && !workouts.some((w) => w.id === lastInPhase.id)) workouts.push(lastInPhase)
    const input = { today, now, settings, phase, routinesById, workouts }
    const plan = loading ? null : todayPlan(input)
    const strip = loading ? [] : weekStrip(input)
    const abs = weeklyMuscleSessions(workouts, exercisesById, 'abs', today, settings.weekStartsOn, settings.absPerWeek)
    const mobility = weeklyMuscleSessions(workouts, exercisesById, 'mobility', today, settings.weekStartsOn, settings.mobilityPerWeek)
    const phaseRoutines = (phase?.routineIds ?? []).map((id) => routinesById[id]).filter(Boolean)
    return { loading, today, plan, strip, abs, mobility, routinesById, phaseRoutines }
  }, [routines, recent, lastInPhase, today, now, settings, phase, exercisesById])
}

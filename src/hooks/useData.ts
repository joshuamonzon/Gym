import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Exercise, Program, ProgramPhase, Routine, Workout } from '@/db/types'
import { useSettings } from './useSettings'

export function useExercises(includeArchived = false): Exercise[] | undefined {
  const list = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
  return useMemo(() => (list ? (includeArchived ? list : list.filter((e) => !e.archived)) : undefined), [list, includeArchived])
}

export function useExercisesById(): Record<string, Exercise> {
  const list = useLiveQuery(() => db.exercises.toArray(), [])
  return useMemo(() => {
    const map: Record<string, Exercise> = {}
    for (const e of list ?? []) map[e.id] = e
    return map
  }, [list])
}

export function useExercise(id: string | undefined): Exercise | undefined {
  return useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id])
}

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(() => db.routines.toArray(), [])
}

export function useRoutine(id: string | undefined): Routine | undefined {
  return useLiveQuery(() => (id ? db.routines.get(id) : undefined), [id])
}

export function usePrograms(): Program[] | undefined {
  return useLiveQuery(() => db.programs.toArray(), [])
}

export function useActiveProgram(): { program: Program | undefined; phase: ProgramPhase | undefined } {
  const settings = useSettings()
  const programs = usePrograms()
  return useMemo(() => {
    const program = programs?.find((p) => p.id === settings.activeProgramId)
    const phase = program?.phases.find((p) => p.id === settings.activePhaseId)
    return { program, phase }
  }, [programs, settings.activeProgramId, settings.activePhaseId])
}

/** All finished workouts, newest first. */
export function useWorkouts(): Workout[] | undefined {
  const list = useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), [])
  return useMemo(() => list?.filter((w) => w.finishedAt), [list])
}

export function useWorkout(id: string | undefined): Workout | undefined {
  return useLiveQuery(() => (id ? db.workouts.get(id) : undefined), [id])
}

export function useWorkoutsForExercise(exerciseId: string | undefined): Workout[] | undefined {
  const list = useLiveQuery(() => (exerciseId ? db.workouts.where('exerciseIds').equals(exerciseId).toArray() : []), [exerciseId])
  return useMemo(() => list?.filter((w) => w.finishedAt).sort((a, b) => a.startedAt - b.startedAt), [list])
}

export function useLatestBodyweight(): number | null {
  const rows = useLiveQuery(() => db.measurements.orderBy('date').reverse().toArray(), [])
  return useMemo(() => rows?.find((m) => typeof m.weightLb === 'number')?.weightLb ?? null, [rows])
}

export function useWorkoutCount(): number {
  return useLiveQuery(() => db.workouts.count(), [], 0)
}

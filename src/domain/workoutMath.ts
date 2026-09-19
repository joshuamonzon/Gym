import type { Workout, WorkoutExercise } from '@/db/types'
import { toLocalDate } from './dates'
import { workoutReps, workoutVolumeLb } from './volume'

/** Recompute every derived field so the stored record is always consistent. */
export function finalizeWorkout(w: Workout): Workout {
  const end = w.finishedAt ?? w.startedAt
  const exerciseIds = Array.from(new Set(w.exercises.map((e) => e.exerciseId)))
  let prCount = 0
  for (const e of w.exercises) for (const s of e.sets) if (s.prs && s.prs.length) prCount += 1
  return {
    ...w,
    localDate: toLocalDate(w.startedAt),
    durationSec: Math.max(0, Math.round((end - w.startedAt) / 1000)),
    volumeLb: workoutVolumeLb(w.exercises),
    totalReps: workoutReps(w.exercises),
    prCount,
    exerciseIds,
  }
}

/** Drop sets that were never completed and exercises left with no sets. */
export function pruneIncomplete(w: Workout): Workout {
  const exercises = w.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed) }))
    .filter((e) => e.sets.length > 0)
  return { ...w, exercises }
}

/** Weight of the first completed top set (working or activation). */
export function topSetWeightLb(we: WorkoutExercise): number | null {
  const s = we.sets.find((x) => x.completed && (x.kind === 'working' || x.kind === 'activation') && x.weightLb !== null)
  return s?.weightLb ?? null
}

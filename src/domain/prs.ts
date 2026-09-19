import type { Exercise, Workout, WorkoutSet, PrKind } from '@/db/types'
import { estimate1rm } from './e1rm'

export interface ExerciseBests {
  maxWeightLb: number | null
  maxE1rm: number | null
  maxSetVolume: number | null
  bestSet: { weightLb: number | null; reps: number | null; workoutId: string; localDate: string } | null
}

function countsForPr(set: WorkoutSet): boolean {
  return set.completed && set.kind !== 'warmup'
}

/** Best numbers for an exercise across a list of finished workouts. */
export function bestsForExercise(
  workouts: Workout[],
  exercise: Exercise,
  bodyweightLb: number | null,
  excludeWorkoutId?: string,
): ExerciseBests {
  const bests: ExerciseBests = { maxWeightLb: null, maxE1rm: null, maxSetVolume: null, bestSet: null }
  for (const w of workouts) {
    if (!w.finishedAt || w.id === excludeWorkoutId) continue
    for (const we of w.exercises) {
      if (we.exerciseId !== exercise.id) continue
      for (const s of we.sets) {
        if (!countsForPr(s)) continue
        const weight = s.weightLb
        if (weight !== null && (bests.maxWeightLb === null || weight > bests.maxWeightLb)) bests.maxWeightLb = weight
        const e = estimate1rm(s.weightLb, s.reps, exercise.loadType, bodyweightLb)
        if (e !== null && (bests.maxE1rm === null || e > bests.maxE1rm)) {
          bests.maxE1rm = e
          bests.bestSet = { weightLb: s.weightLb, reps: s.reps, workoutId: w.id, localDate: w.localDate }
        }
        if (weight !== null && s.reps !== null) {
          const v = weight * s.reps
          if (bests.maxSetVolume === null || v > bests.maxSetVolume) bests.maxSetVolume = v
        }
      }
    }
  }
  return bests
}

/** Return a copy of the workout with PR flags on every set that beats prior bests. */
export function flagPrs(
  workout: Workout,
  history: Workout[],
  exercisesById: Record<string, Exercise>,
  bodyweightLb: number | null,
): Workout {
  const exercises = workout.exercises.map((we) => {
    const ex = exercisesById[we.exerciseId]
    if (!ex || ex.loadType === 'time' || ex.loadType === 'bodyweight') {
      return { ...we, sets: we.sets.map((s) => ({ ...s, prs: undefined })) }
    }
    const prior = bestsForExercise(history, ex, bodyweightLb, workout.id)
    // Track running bests inside this workout so only the first beating set is flagged.
    let bestW = prior.maxWeightLb
    let bestE = prior.maxE1rm
    let bestV = prior.maxSetVolume
    const sets = we.sets.map((s) => {
      if (!countsForPr(s)) return { ...s, prs: undefined }
      const prs: PrKind[] = []
      if (s.weightLb !== null && (bestW === null || s.weightLb > bestW)) {
        prs.push('weight')
        bestW = s.weightLb
      }
      const e = estimate1rm(s.weightLb, s.reps, ex.loadType, bodyweightLb)
      if (e !== null && (bestE === null || e > bestE)) {
        prs.push('e1rm')
        bestE = e
      }
      if (s.weightLb !== null && s.reps !== null) {
        const v = s.weightLb * s.reps
        if (bestV === null || v > bestV) {
          prs.push('volume')
          bestV = v
        }
      }
      return { ...s, prs: prs.length ? prs : undefined }
    })
    return { ...we, sets }
  })
  return { ...workout, exercises }
}

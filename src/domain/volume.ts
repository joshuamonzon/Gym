import type { WorkoutExercise, WorkoutSet } from '@/db/types'

export function setVolumeLb(set: WorkoutSet): number {
  if (!set.completed || set.kind === 'warmup') return 0
  if (set.weightLb === null || set.reps === null) return 0
  return set.weightLb * set.reps
}

export function workoutVolumeLb(exercises: WorkoutExercise[]): number {
  let total = 0
  for (const e of exercises) for (const s of e.sets) total += setVolumeLb(s)
  return Math.round(total * 100) / 100
}

export function workoutReps(exercises: WorkoutExercise[]): number {
  let total = 0
  for (const e of exercises) for (const s of e.sets) if (s.completed && s.kind !== 'warmup') total += s.reps ?? 0
  return total
}

export function completedSetCount(exercises: WorkoutExercise[]): number {
  let n = 0
  for (const e of exercises) for (const s of e.sets) if (s.completed) n += 1
  return n
}

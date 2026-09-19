import { useLiveQuery } from 'dexie-react-hooks'
import type { WorkoutExercise } from '@/db/types'
import { lastExerciseBlocks } from '@/db/repo/activeWorkout'

/** Last logged block per exercise for the PREVIOUS column. */
export function usePreviousBlocks(exerciseIds: string[], excludeWorkoutId?: string): Record<string, WorkoutExercise | undefined> {
  const key = exerciseIds.join(',')
  return useLiveQuery(() => lastExerciseBlocks(key ? key.split(',') : [], excludeWorkoutId), [key, excludeWorkoutId], {})
}

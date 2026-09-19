import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { ExerciseProgress } from '@/db/types'
import { lastExerciseBlocks } from '@/db/repo/activeWorkout'
import { workingWeightFor } from '@/domain/buildWorkoutDraft'
import { topSetWeightLb } from '@/domain/workoutMath'

/** The weight the next session will pre-fill for each exercise (progress row, else last logged top set). */
export function useWorkingWeights(exerciseIds: string[]): Record<string, number | null> {
  const key = exerciseIds.join(',')
  return useLiveQuery(
    async () => {
      const ids = key ? Array.from(new Set(key.split(','))) : []
      const out: Record<string, number | null> = {}
      if (ids.length === 0) return out
      const [progress, blocks] = await Promise.all([db.exerciseProgress.toArray(), lastExerciseBlocks(ids)])
      const progressById: Record<string, ExerciseProgress> = {}
      for (const p of progress) progressById[p.exerciseId] = p
      const lastTopSetLb: Record<string, number | null> = {}
      for (const id of ids) lastTopSetLb[id] = blocks[id] ? topSetWeightLb(blocks[id]!) : null
      for (const id of ids) out[id] = workingWeightFor(id, progressById, lastTopSetLb)
      return out
    },
    [key],
    {},
  )
}

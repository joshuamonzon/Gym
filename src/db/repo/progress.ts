import { db } from '../db'
import type { ExerciseProgress } from '../types'

export function getProgress(exerciseId: string) {
  return db.exerciseProgress.get(exerciseId)
}

export function allProgress() {
  return db.exerciseProgress.toArray()
}

export async function setNextWorkingWeight(exerciseId: string, nextWorkingWeightLb: number | null, now = Date.now()) {
  await db.transaction('rw', db.exerciseProgress, async () => {
    const current = await db.exerciseProgress.get(exerciseId)
    await db.exerciseProgress.put({
      exerciseId,
      workingWeightLb: current?.workingWeightLb ?? null,
      nextWorkingWeightLb,
      lastPerformedAt: current?.lastPerformedAt ?? null,
      updatedAt: now,
    })
  })
}

export function progressById(list: ExerciseProgress[]): Record<string, ExerciseProgress> {
  const map: Record<string, ExerciseProgress> = {}
  for (const p of list) map[p.exerciseId] = p
  return map
}

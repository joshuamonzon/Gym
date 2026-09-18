import { db } from '../db'
import { newId } from '@/lib/id'
import type { Exercise } from '../types'

export type ExerciseInput = Omit<Exercise, 'id' | 'builtIn' | 'createdAt' | 'updatedAt'>

export function allExercises() {
  return db.exercises.orderBy('name').toArray()
}

export function getExercise(id: string) {
  return db.exercises.get(id)
}

export async function createExercise(input: ExerciseInput, now = Date.now()): Promise<Exercise> {
  const ex: Exercise = { ...input, id: newId(), builtIn: false, createdAt: now, updatedAt: now }
  await db.exercises.add(ex)
  return ex
}

export async function updateExercise(id: string, patch: Partial<ExerciseInput>, now = Date.now()) {
  await db.exercises.update(id, { ...patch, updatedAt: now })
}

/** Exercises referenced by history are never deleted, only hidden. */
export async function archiveExercise(id: string, archived = true, now = Date.now()) {
  await db.exercises.update(id, { archived, updatedAt: now })
}

export async function deleteExerciseIfUnused(id: string): Promise<boolean> {
  return db.transaction('rw', [db.exercises, db.workouts, db.routines], async () => {
    const used = await db.workouts.where('exerciseIds').equals(id).count()
    const inRoutine = (await db.routines.toArray()).some((r) => r.exercises.some((e) => e.exerciseId === id))
    if (used > 0 || inRoutine) {
      await db.exercises.update(id, { archived: true })
      return false
    }
    await db.exercises.delete(id)
    return true
  })
}

export function exercisesById(list: Exercise[]): Record<string, Exercise> {
  const map: Record<string, Exercise> = {}
  for (const e of list) map[e.id] = e
  return map
}

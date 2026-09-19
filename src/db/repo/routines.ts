import { db } from '../db'
import { newId } from '@/lib/id'
import type { Routine } from '../types'

export type RoutineInput = Omit<Routine, 'id' | 'builtIn' | 'createdAt' | 'updatedAt'>

export function allRoutines() {
  return db.routines.toArray()
}

export function getRoutine(id: string) {
  return db.routines.get(id)
}

export async function createRoutine(input: RoutineInput, now = Date.now()): Promise<Routine> {
  const r: Routine = { ...input, id: newId(), builtIn: false, createdAt: now, updatedAt: now }
  await db.routines.add(r)
  return r
}

export async function saveRoutine(routine: Routine, now = Date.now()) {
  await db.routines.put({ ...routine, updatedAt: now })
}

export async function deleteRoutine(id: string) {
  await db.routines.delete(id)
}

export async function duplicateRoutine(id: string, now = Date.now()): Promise<Routine | undefined> {
  const src = await db.routines.get(id)
  if (!src) return undefined
  const copy: Routine = {
    ...src,
    id: newId(),
    name: `${src.name} (copy)`,
    builtIn: false,
    programId: undefined,
    exercises: src.exercises.map((e) => ({ ...e, id: newId() })),
    createdAt: now,
    updatedAt: now,
  }
  await db.routines.add(copy)
  return copy
}

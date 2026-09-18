import { db } from '../db'
import type { Workout } from '../types'
import { finalizeWorkout } from '@/domain/workoutMath'

/** Persist a workout, recomputing every derived field first. */
export async function saveWorkout(workout: Workout) {
  await db.workouts.put(finalizeWorkout(workout))
}

export function getWorkout(id: string) {
  return db.workouts.get(id)
}

export async function deleteWorkout(id: string) {
  await db.workouts.delete(id)
}

export function recentWorkouts(limit = 50) {
  return db.workouts.orderBy('startedAt').reverse().limit(limit).toArray()
}

export function allWorkouts() {
  return db.workouts.orderBy('startedAt').toArray()
}

export function workoutsSince(startedAt: number) {
  return db.workouts.where('startedAt').aboveOrEqual(startedAt).toArray()
}

export function workoutsBetweenDates(fromLocalDate: string, toLocalDate: string) {
  return db.workouts.where('localDate').between(fromLocalDate, toLocalDate, true, true).toArray()
}

export function workoutsForExercise(exerciseId: string) {
  return db.workouts.where('exerciseIds').equals(exerciseId).toArray()
}

/** Latest finished workout containing the exercise (excluding one id). */
export async function lastWorkoutForExercise(exerciseId: string, excludeId?: string): Promise<Workout | undefined> {
  const list = await workoutsForExercise(exerciseId)
  return list
    .filter((w) => w.finishedAt && w.id !== excludeId)
    .sort((a, b) => b.startedAt - a.startedAt)[0]
}

export async function lastFinishedWorkout(): Promise<Workout | undefined> {
  const list = await db.workouts.orderBy('startedAt').reverse().limit(5).toArray()
  return list.find((w) => w.finishedAt)
}

export function countWorkouts() {
  return db.workouts.count()
}

/** An empty finished workout on a given day, for logging something after the fact. */
export async function createManualWorkout(localDate: string, title = 'Workout'): Promise<Workout> {
  const { newId } = await import('@/lib/id')
  const { parseLocalDate } = await import('@/domain/dates')
  const startedAt = parseLocalDate(localDate).getTime() + 12 * 3_600_000
  const w: Workout = {
    id: newId(), title, routineId: null, routineName: null, startedAt, finishedAt: startedAt + 3_600_000, localDate,
    durationSec: 3600, volumeLb: 0, totalReps: 0, prCount: 0, exercises: [], exerciseIds: [], source: 'app',
  }
  await db.workouts.add(finalizeWorkout(w))
  return w
}

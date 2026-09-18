import type { SetKind, Workout, WorkoutExercise, WorkoutSet } from '@/db/types'
import { newId } from '@/lib/id'

export interface SetFill {
  weightLb: number | null
  reps: number | null
  durationSec: number | null
}

function mapExercise(w: Workout, weId: string, fn: (we: WorkoutExercise) => WorkoutExercise): Workout {
  return { ...w, exercises: w.exercises.map((we) => (we.id === weId ? fn(we) : we)) }
}

function mapSet(w: Workout, weId: string, setId: string, fn: (s: WorkoutSet) => WorkoutSet): Workout {
  return mapExercise(w, weId, (we) => ({ ...we, sets: we.sets.map((s) => (s.id === setId ? fn(s) : s)) }))
}

export function syncExerciseIds(w: Workout): Workout {
  return { ...w, exerciseIds: Array.from(new Set(w.exercises.map((e) => e.exerciseId))) }
}

export function updateSet(w: Workout, weId: string, setId: string, patch: Partial<WorkoutSet>): Workout {
  return mapSet(w, weId, setId, (s) => ({ ...s, ...patch }))
}

export function completeSet(w: Workout, weId: string, setId: string, fill: SetFill, now: number): Workout {
  return mapSet(w, weId, setId, (s) => ({
    ...s,
    weightLb: s.weightLb ?? fill.weightLb,
    reps: s.reps ?? fill.reps,
    durationSec: s.durationSec ?? fill.durationSec,
    completed: true,
    completedAt: now,
  }))
}

export function uncompleteSet(w: Workout, weId: string, setId: string): Workout {
  return mapSet(w, weId, setId, (s) => ({ ...s, completed: false, completedAt: undefined, prs: undefined }))
}

export function addSet(w: Workout, weId: string): Workout {
  return mapExercise(w, weId, (we) => {
    const last = we.sets[we.sets.length - 1]
    let kind: SetKind = 'working'
    if (last) {
      if (last.kind === 'activation' || last.kind === 'mini') kind = 'mini'
      else if (last.kind === 'extra') kind = 'extra'
      else if (last.kind === 'working') kind = 'working'
    }
    const s: WorkoutSet = {
      id: newId(),
      kind,
      targetWeightLb: last ? last.weightLb ?? last.targetWeightLb : null,
      targetRepMin: last?.targetRepMin ?? null,
      targetRepMax: last?.targetRepMax ?? null,
      targetDurationSec: last?.targetDurationSec ?? null,
      restSec: last?.restSec ?? we.restSec,
      weightLb: null,
      reps: null,
      durationSec: null,
      completed: false,
    }
    return { ...we, sets: [...we.sets, s] }
  })
}

export function removeSet(w: Workout, weId: string, setId: string): Workout {
  return mapExercise(w, weId, (we) => ({ ...we, sets: we.sets.filter((s) => s.id !== setId) }))
}

export function setSetKind(w: Workout, weId: string, setId: string, kind: SetKind): Workout {
  return mapSet(w, weId, setId, (s) => ({ ...s, kind }))
}

export function addExercise(w: Workout, we: WorkoutExercise): Workout {
  return syncExerciseIds({ ...w, exercises: [...w.exercises, we] })
}

export function removeExercise(w: Workout, weId: string): Workout {
  return syncExerciseIds({ ...w, exercises: w.exercises.filter((e) => e.id !== weId) })
}

export function replaceExercise(w: Workout, weId: string, we: WorkoutExercise): Workout {
  return syncExerciseIds({ ...w, exercises: w.exercises.map((e) => (e.id === weId ? { ...we, id: weId, notes: e.notes } : e)) })
}

export function moveExercise(w: Workout, weId: string, delta: -1 | 1): Workout {
  const i = w.exercises.findIndex((e) => e.id === weId)
  const j = i + delta
  if (i === -1 || j < 0 || j >= w.exercises.length) return w
  const list = [...w.exercises]
  const [item] = list.splice(i, 1)
  list.splice(j, 0, item)
  return { ...w, exercises: list }
}

export function setExerciseNotes(w: Workout, weId: string, notes: string): Workout {
  return mapExercise(w, weId, (we) => ({ ...we, notes: notes || undefined }))
}

export function setExerciseRest(w: Workout, weId: string, restSec: number): Workout {
  return mapExercise(w, weId, (we) => ({
    ...we,
    restSec,
    sets: we.sets.map((s) => (s.kind === 'working' || s.kind === 'extra' || s.kind === 'activation' ? { ...s, restSec } : s)),
  }))
}

export function setWorkoutMeta(w: Workout, patch: { title?: string; notes?: string; startedAt?: number; finishedAt?: number | null }): Workout {
  return { ...w, ...patch }
}

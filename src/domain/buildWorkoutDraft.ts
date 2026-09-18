import type {
  Exercise,
  ExerciseProgress,
  ProgramPhase,
  Routine,
  RoutineExercise,
  Scheme,
  SetPrescription,
  Settings,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '@/db/types'
import { newId } from '@/lib/id'
import { computeTargets } from './rpt'
import { warmupSets } from './warmups'
import { toLocalDate } from './dates'

export interface DraftInputs {
  routine: Routine | null
  exercisesById: Record<string, Exercise>
  progressById: Record<string, ExerciseProgress>
  /** Last logged top-set weight per exercise, used when no progress row exists. */
  lastTopSetLb: Record<string, number | null>
  settings: Settings
  phase: ProgramPhase | undefined
  now: number
}

function restFor(kind: WorkoutSet['kind'], p: SetPrescription | undefined, exerciseRest: number, settings: Settings): number {
  if (p?.restSec !== undefined) return p.restSec
  if (kind === 'warmup') return settings.restDefaults.warmup
  if (kind === 'mini') return settings.restDefaults.restPause
  return exerciseRest
}

export function workingWeightFor(exerciseId: string, progressById: Record<string, ExerciseProgress>, lastTopSetLb: Record<string, number | null>): number | null {
  const p = progressById[exerciseId]
  return p?.nextWorkingWeightLb ?? p?.workingWeightLb ?? lastTopSetLb[exerciseId] ?? null
}

/** Build the logged-exercise block for one prescription. */
export function buildWorkoutExercise(
  ex: Exercise,
  scheme: Scheme,
  prescriptions: SetPrescription[],
  exerciseRest: number,
  workingWeightLb: number | null,
  settings: Settings,
  extras: { notes?: string; extraSets?: number } = {},
): WorkoutExercise {
  const targets = computeTargets(prescriptions, workingWeightLb, ex.roundingLb)
  const sets: WorkoutSet[] = []
  const isTimed = ex.loadType === 'time'

  if (settings.autoWarmups && scheme === 'rpt' && !isTimed) {
    for (const w of warmupSets(workingWeightLb, ex.roundingLb, ex.loadType)) {
      sets.push({
        id: newId(), kind: 'warmup', targetWeightLb: w.weightLb, targetRepMin: w.reps, targetRepMax: w.reps, targetDurationSec: null,
        restSec: settings.restDefaults.warmup, weightLb: null, reps: null, durationSec: null, completed: false,
      })
    }
  }
  prescriptions.forEach((p, i) => {
    sets.push({
      id: newId(),
      kind: p.kind,
      targetWeightLb: isTimed ? null : targets[i],
      targetRepMin: p.repMin ?? null,
      targetRepMax: p.repMax ?? null,
      targetDurationSec: p.durationSec ?? null,
      restSec: restFor(p.kind, p, exerciseRest, settings),
      weightLb: null,
      reps: null,
      durationSec: null,
      completed: false,
    })
  })
  const extra = extras.extraSets ?? 0
  if (extra > 0 && prescriptions.length > 0) {
    const lastP = prescriptions[prescriptions.length - 1]
    const lastT = targets[targets.length - 1]
    for (let i = 0; i < extra; i += 1) {
      sets.push({
        id: newId(), kind: 'extra', targetWeightLb: isTimed ? null : lastT, targetRepMin: lastP.repMin ?? null, targetRepMax: lastP.repMax ?? null,
        targetDurationSec: lastP.durationSec ?? null, restSec: restFor('extra', lastP, exerciseRest, settings), weightLb: null, reps: null, durationSec: null, completed: false,
      })
    }
  }
  return {
    id: newId(),
    exerciseId: ex.id,
    nameSnapshot: ex.name,
    scheme,
    restSec: exerciseRest,
    notes: extras.notes,
    coachingNotes: ex.coachingNotes,
    sets,
  }
}

export function fromRoutineExercise(re: RoutineExercise, input: DraftInputs, extraSets = 0): WorkoutExercise | null {
  const ex = input.exercisesById[re.exerciseId]
  if (!ex) return null
  const ww = workingWeightFor(ex.id, input.progressById, input.lastTopSetLb)
  return buildWorkoutExercise(ex, re.scheme, re.sets, re.restSec, ww, input.settings, { notes: re.notes, extraSets })
}

export function emptyWorkout(now: number, title = 'Workout'): Workout {
  return {
    id: newId(),
    title,
    routineId: null,
    routineName: null,
    startedAt: now,
    finishedAt: null,
    localDate: toLocalDate(now),
    durationSec: 0,
    volumeLb: 0,
    totalReps: 0,
    prCount: 0,
    exercises: [],
    exerciseIds: [],
    source: 'app',
  }
}

/** A fresh in-progress workout from a routine (or empty when routine is null). */
export function buildWorkoutDraft(input: DraftInputs): Workout {
  const { routine, settings, phase, now } = input
  const w = emptyWorkout(now, routine?.name ?? 'Workout')
  if (!routine) return w
  w.routineId = routine.id
  w.routineName = routine.name
  w.programId = routine.programId
  w.phaseId = phase && phase.routineIds.includes(routine.id) ? phase.id : undefined
  const specialExercise = phase?.specialization ? settings.specialization[routine.id] : undefined
  const extra = phase?.specialization?.extraSets ?? 0
  for (const re of routine.exercises) {
    const we = fromRoutineExercise(re, input, specialExercise === re.exerciseId ? extra : 0)
    if (we) w.exercises.push(we)
  }
  w.exerciseIds = Array.from(new Set(w.exercises.map((e) => e.exerciseId)))
  return w
}

// Domain types shared by seeds, repositories, pure domain logic and the UI.
// Weights are always stored in pounds; kg is a display conversion only.

export type Id = string

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'back'
  | 'biceps'
  | 'legs'
  | 'hamstrings'
  | 'glutes'
  | 'abs'
  | 'traps'
  | 'neck'
  | 'forearms'
  | 'mobility'
  | 'other'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'weighted_bodyweight'
  | 'other'

/** How load is expressed for the exercise. */
export type LoadType =
  | 'external' // barbell / dumbbell / cable weight
  | 'bodyweight_plus' // bodyweight plus added weight (weighted chin-ups, dips)
  | 'bodyweight' // reps only
  | 'time' // seconds only (planks, holds)

export type Scheme =
  | 'rpt' // reverse pyramid: heavy set first, then -10% each set
  | 'rest_pause' // activation set to failure + mini-sets
  | 'straight' // same weight, fixed rep range
  | 'timed' // holds
  | 'free' // untracked targets

export type SetKind = 'warmup' | 'working' | 'activation' | 'mini' | 'extra'

export type WeightUnit = 'lb' | 'kg'

export type PrKind = 'weight' | 'e1rm' | 'volume'

export interface Exercise {
  id: Id
  name: string
  aliases?: string[]
  muscleGroup: MuscleGroup
  equipment: Equipment
  loadType: LoadType
  defaultScheme: Scheme
  defaultRestSec: number
  /** Weight added when the top set hits the top of its rep range. */
  incrementLb: number
  /** Plate rounding for derived (RPT) sets. */
  roundingLb: number
  isUnilateral?: boolean
  coachingNotes?: string
  builtIn: boolean
  archived?: boolean
  createdAt: number
  updatedAt: number
}

export interface SetPrescription {
  kind: SetKind
  repMin?: number
  repMax?: number
  /** Fraction of the previous set's weight (RPT drop), e.g. 0.9. */
  pctOfPrev?: number
  restSec?: number
  durationSec?: number
}

export interface RoutineExercise {
  id: Id
  exerciseId: Id
  scheme: Scheme
  sets: SetPrescription[]
  restSec: number
  notes?: string
  /** Exercises that can be swapped in (plateau rule). */
  alternatives?: Id[]
}

export type RoutineKind = 'main' | 'abs' | 'mobility' | 'finisher'

export interface Routine {
  id: Id
  programId?: Id
  name: string
  /** Short badge such as "A" or "B". */
  shortLabel?: string
  kind: RoutineKind
  description?: string
  exercises: RoutineExercise[]
  builtIn: boolean
  createdAt: number
  updatedAt: number
}

export interface ProgramPhase {
  id: Id
  name: string
  description?: string
  durationWeeks?: number
  /** Rotation order; the scheduler cycles through these. */
  routineIds: Id[]
  /** When set, weekday (0 = Sunday) → routine, instead of rotating. */
  pinnedWeekdays?: Record<number, Id>
  /** Phase Two: one chosen exercise per routine gets extra sets. */
  specialization?: { extraSets: number; choices: Record<Id, Id[]> }
  /** Phase Three: number of MEGA levels available. */
  megaLevels?: number
}

export interface Program {
  id: Id
  name: string
  description?: string
  phases: ProgramPhase[]
  builtIn: boolean
}

export interface WorkoutSet {
  id: Id
  kind: SetKind
  targetWeightLb: number | null
  targetRepMin: number | null
  targetRepMax: number | null
  targetDurationSec: number | null
  restSec: number
  weightLb: number | null
  reps: number | null
  durationSec: number | null
  completed: boolean
  completedAt?: number
  prs?: PrKind[]
}

export interface WorkoutExercise {
  id: Id
  exerciseId: Id
  /** Name at the time of logging, so history survives renames. */
  nameSnapshot: string
  scheme: Scheme
  restSec: number
  notes?: string
  coachingNotes?: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: Id
  title: string
  routineId: Id | null
  routineName: string | null
  programId?: Id
  phaseId?: Id
  startedAt: number
  finishedAt: number | null
  /** Local calendar date 'YYYY-MM-DD' of startedAt. */
  localDate: string
  durationSec: number
  volumeLb: number
  totalReps: number
  prCount: number
  exercises: WorkoutExercise[]
  /** Derived from exercises; kept in sync on every write (multiEntry index). */
  exerciseIds: Id[]
  notes?: string
  source: 'app' | 'import'
}

export interface RestTimerState {
  setId: Id
  exerciseId: Id
  startedAt: number
  endsAt: number
  durationSec: number
  fired: boolean
}

export interface ActiveWorkout {
  id: 'current'
  draft: Workout
  restTimer: RestTimerState | null
}

export interface ExerciseProgress {
  exerciseId: Id
  /** Weight used on the most recent top set. */
  workingWeightLb: number | null
  /** Suggested weight for the next top set. */
  nextWorkingWeightLb: number | null
  lastPerformedAt: number | null
  updatedAt: number
}

export interface Measurement {
  /** 'YYYY-MM-DD', one entry per day. */
  date: string
  weightLb?: number
  waistIn?: number
  note?: string
}

export interface RestDefaults {
  rpt: number
  restPause: number
  accessory: number
  warmup: number
}

export interface Settings {
  id: 'app'
  unit: WeightUnit
  /** Weekdays trained, 0 = Sunday … 6 = Saturday. */
  trainingDays: number[]
  weekStartsOn: 0 | 1
  activeProgramId: Id
  activePhaseId: Id
  /** Phase Two: routineId → exerciseId that receives the extra sets. */
  specialization: Record<Id, Id>
  megaLevel: 1 | 2 | 3
  /** One-off "do this routine next instead of the rotation". */
  nextOverrideRoutineId: Id | null
  restDefaults: RestDefaults
  autoWarmups: boolean
  heightIn: number | null
  absPerWeek: number
  mobilityPerWeek: number
  timerSound: boolean
  keepAwakeAudio: boolean
  seedVersion: number
  lastBackupAt: number | null
  createdAt: number
}

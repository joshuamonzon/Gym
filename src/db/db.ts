import Dexie, { type EntityTable } from 'dexie'
import type {
  ActiveWorkout,
  Exercise,
  ExerciseProgress,
  Measurement,
  Program,
  Routine,
  Settings,
  Workout,
} from './types'
import { SEED_VERSION, defaultSettings, seedExercises, seedPrograms, seedRoutines } from './seed'

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  programs!: EntityTable<Program, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  exerciseProgress!: EntityTable<ExerciseProgress, 'exerciseId'>
  measurements!: EntityTable<Measurement, 'date'>
  activeWorkout!: EntityTable<ActiveWorkout, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor(name = 'gym') {
    super(name)
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, equipment',
      routines: 'id, programId, kind',
      programs: 'id',
      workouts: 'id, startedAt, localDate, routineId, *exerciseIds',
      exerciseProgress: 'exerciseId',
      measurements: 'date',
      activeWorkout: 'id',
      settings: 'id',
    })
    this.on('populate', () => seedAll(this))
  }
}

/** Fresh database: insert every built-in row and default settings. */
export async function seedAll(database: GymDB) {
  await database.exercises.bulkAdd(seedExercises)
  await database.routines.bulkAdd(seedRoutines)
  await database.programs.bulkAdd(seedPrograms)
  await database.settings.add(defaultSettings())
}

/**
 * Existing database: make sure settings exist and, when the seed data version
 * moved on, insert any built-in row that is missing. Never overwrites user edits.
 */
export async function ensureSeeds(database: GymDB) {
  await database.transaction('rw', [database.exercises, database.routines, database.programs, database.settings], async () => {
    let settings = await database.settings.get('app')
    if (!settings) {
      settings = defaultSettings()
      await database.settings.add(settings)
    }
    if (settings.seedVersion >= SEED_VERSION) return

    const [exIds, rtIds, pgIds] = await Promise.all([
      database.exercises.toCollection().primaryKeys(),
      database.routines.toCollection().primaryKeys(),
      database.programs.toCollection().primaryKeys(),
    ])
    const have = (ids: string[]) => new Set(ids)
    const ex = have(exIds), rt = have(rtIds), pg = have(pgIds)
    await database.exercises.bulkAdd(seedExercises.filter((e) => !ex.has(e.id)))
    await database.routines.bulkAdd(seedRoutines.filter((r) => !rt.has(r.id)))
    await database.programs.bulkAdd(seedPrograms.filter((p) => !pg.has(p.id)))
    await database.settings.update('app', { seedVersion: SEED_VERSION })
  })
}

export const db = new GymDB()

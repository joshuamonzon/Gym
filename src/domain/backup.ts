import type { ActiveWorkout, Exercise, ExerciseProgress, Measurement, Program, Routine, Settings, Workout } from '@/db/types'

export interface BackupFile {
  app: 'gym'
  version: 1
  exportedAt: number
  tables: {
    exercises: Exercise[]
    routines: Routine[]
    programs: Program[]
    workouts: Workout[]
    exerciseProgress: ExerciseProgress[]
    measurements: Measurement[]
    activeWorkout: ActiveWorkout[]
    settings: Settings[]
  }
}

export const BACKUP_TABLES = ['exercises', 'routines', 'programs', 'workouts', 'exerciseProgress', 'measurements', 'activeWorkout', 'settings'] as const

export function backupFileName(now = Date.now()): string {
  const d = new Date(now)
  const p = (n: number) => String(n).padStart(2, '0')
  return `gym-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`
}

/** Throws with a readable message when the JSON is not a backup we wrote. */
export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!data || typeof data !== 'object') throw new Error('That file is not a Gym backup.')
  const b = data as Partial<BackupFile>
  if (b.app !== 'gym' || b.version !== 1 || !b.tables || typeof b.tables !== 'object') {
    throw new Error('That file is not a Gym backup (wrong app or version).')
  }
  for (const t of BACKUP_TABLES) {
    const rows = (b.tables as Record<string, unknown>)[t]
    if (!Array.isArray(rows)) throw new Error(`Backup is missing the "${t}" table.`)
  }
  return b as BackupFile
}

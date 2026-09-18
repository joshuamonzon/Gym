import Dexie from 'dexie'
import { db } from '../db'
import type { BackupFile } from '@/domain/backup'

export async function exportBackup(now = Date.now()): Promise<BackupFile> {
  const [exercises, routines, programs, workouts, exerciseProgress, measurements, activeWorkout, settings] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.programs.toArray(),
    db.workouts.toArray(),
    db.exerciseProgress.toArray(),
    db.measurements.toArray(),
    db.activeWorkout.toArray(),
    db.settings.toArray(),
  ])
  await db.settings.update('app', { lastBackupAt: now })
  return { app: 'gym', version: 1, exportedAt: now, tables: { exercises, routines, programs, workouts, exerciseProgress, measurements, activeWorkout, settings } }
}

/** Replace everything with the backup's contents, atomically. */
export async function importBackup(b: BackupFile): Promise<void> {
  const tables = [db.exercises, db.routines, db.programs, db.workouts, db.exerciseProgress, db.measurements, db.activeWorkout, db.settings]
  await db.transaction('rw', tables, async () => {
    for (const t of tables) await t.clear()
    await db.exercises.bulkPut(b.tables.exercises)
    await db.routines.bulkPut(b.tables.routines)
    await db.programs.bulkPut(b.tables.programs)
    await db.workouts.bulkPut(b.tables.workouts)
    await db.exerciseProgress.bulkPut(b.tables.exerciseProgress)
    await db.measurements.bulkPut(b.tables.measurements)
    await db.activeWorkout.bulkPut(b.tables.activeWorkout)
    await db.settings.bulkPut(b.tables.settings)
  })
}

export async function resetDatabase(): Promise<void> {
  db.close()
  await Dexie.delete(db.name)
}

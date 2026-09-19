import { db } from '../db'
import type { Measurement } from '../types'

export function allMeasurements() {
  return db.measurements.orderBy('date').toArray()
}

export async function upsertMeasurement(date: string, patch: Partial<Omit<Measurement, 'date'>>) {
  await db.transaction('rw', db.measurements, async () => {
    const current = await db.measurements.get(date)
    await db.measurements.put({ ...(current ?? { date }), ...patch, date })
  })
}

export async function deleteMeasurement(date: string) {
  await db.measurements.delete(date)
}

/** Most recent logged bodyweight in pounds, or null. */
export async function latestBodyweightLb(): Promise<number | null> {
  const rows = await db.measurements.orderBy('date').reverse().toArray()
  const row = rows.find((m) => typeof m.weightLb === 'number')
  return row?.weightLb ?? null
}

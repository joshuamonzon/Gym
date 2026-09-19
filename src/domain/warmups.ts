import type { LoadType } from '@/db/types'
import { roundToStep } from './rounding'

export interface WarmupSpec {
  weightLb: number
  reps: number
}

/** Two ramp-up sets: 50% × 5 and 75% × 3 of the working weight. */
export function warmupSets(workingWeightLb: number | null, roundingLb: number, loadType: LoadType): WarmupSpec[] {
  if (loadType === 'time' || loadType === 'bodyweight') return []
  if (workingWeightLb === null) return []
  if (loadType === 'bodyweight_plus') {
    // Ramp with bodyweight first, then half the added load if there is any.
    const half = roundToStep(workingWeightLb * 0.5, roundingLb)
    return workingWeightLb > 0 && half > 0
      ? [{ weightLb: 0, reps: 5 }, { weightLb: half, reps: 3 }]
      : [{ weightLb: 0, reps: 5 }]
  }
  const step = roundingLb || 2.5
  const w50 = roundToStep(workingWeightLb * 0.5, step)
  const w75 = roundToStep(workingWeightLb * 0.75, step)
  if (w50 <= 0 || w75 <= w50) return []
  return [
    { weightLb: w50, reps: 5 },
    { weightLb: w75, reps: 3 },
  ]
}

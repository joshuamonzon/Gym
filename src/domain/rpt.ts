import type { SetPrescription } from '@/db/types'
import { roundToStep } from './rounding'

/**
 * Target weight for each prescribed set. The first set carries the working
 * weight unrounded (micro-loading applies to the money set); later sets drop
 * by pctOfPrev and are rounded to the plate step. Warm-ups are skipped here.
 */
export function computeTargets(
  sets: SetPrescription[],
  workingWeightLb: number | null,
  roundingLb: number,
): (number | null)[] {
  let prev: number | null = workingWeightLb
  return sets.map((s, i) => {
    if (s.kind === 'warmup') return null
    if (workingWeightLb === null) return null
    if (i === 0 || prev === null) {
      prev = workingWeightLb
      return prev
    }
    if (s.pctOfPrev !== undefined) {
      prev = roundToStep(prev * s.pctOfPrev, roundingLb)
    }
    return prev
  })
}

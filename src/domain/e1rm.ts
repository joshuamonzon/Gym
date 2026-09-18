import type { LoadType } from '@/db/types'

/** Epley estimated one-rep max. */
export function epley(weightLb: number, reps: number): number {
  if (reps <= 1) return weightLb
  return weightLb * (1 + reps / 30)
}

/** Total load moved for a set given how the exercise is loaded. */
export function setLoadLb(weightLb: number | null, loadType: LoadType, bodyweightLb: number | null): number | null {
  if (loadType === 'time') return null
  if (loadType === 'bodyweight') return bodyweightLb
  if (loadType === 'bodyweight_plus') return bodyweightLb === null ? weightLb : bodyweightLb + (weightLb ?? 0)
  return weightLb
}

/**
 * Estimated 1RM expressed in the same terms the user logs (added weight for
 * weighted bodyweight moves). Null when it cannot be estimated.
 */
export function estimate1rm(
  weightLb: number | null,
  reps: number | null,
  loadType: LoadType,
  bodyweightLb: number | null,
): number | null {
  if (reps === null || reps <= 0) return null
  if (loadType === 'time') return null
  if (loadType === 'bodyweight') return null
  if (loadType === 'bodyweight_plus') {
    const added = weightLb ?? 0
    if (bodyweightLb === null) return epley(added, reps)
    return epley(bodyweightLb + added, reps) - bodyweightLb
  }
  if (weightLb === null) return null
  return epley(weightLb, reps)
}

import type { Exercise, WorkoutExercise } from '@/db/types'
import { roundToStep } from './rounding'

/**
 * Effective target weight for every set, live: an explicit target when there is
 * one, otherwise derived from the set before it. RPT drops follow the weight
 * actually lifted on the previous set (so a heavier money set moves the drops),
 * straight sets and rest-pause mini-sets follow the previous set's weight.
 */
export function effectiveTargets(we: WorkoutExercise, exercise: Exercise | undefined, fallbackFirst: number | null = null): (number | null)[] {
  const rounding = exercise?.roundingLb ?? 2.5
  let prevBase: number | null = null
  let prevTarget: number | null = null
  let firstSeen = false
  return we.sets.map((s) => {
    if (s.kind === 'warmup') return s.weightLb ?? s.targetWeightLb
    let target: number | null
    if (!firstSeen) {
      firstSeen = true
      target = s.targetWeightLb ?? fallbackFirst
    } else if (we.scheme === 'rpt' && s.kind === 'working') {
      const pct = s.targetWeightLb !== null && prevTarget !== null && prevTarget > 0 ? s.targetWeightLb / prevTarget : 0.9
      target = prevBase === null ? s.targetWeightLb : roundToStep(prevBase * pct, rounding)
    } else {
      target = prevBase ?? s.targetWeightLb
    }
    const base = s.weightLb ?? target
    prevBase = base
    prevTarget = s.targetWeightLb ?? target
    return target
  })
}

import { EX } from '@/db/seed/exercises'
import type { ExerciseBests } from './prs'
import { epley } from './e1rm'

export interface KeyLift {
  exerciseId: string
  name: string
  targetWeightLb: number
  targetReps: number
  /** Multiple of bodyweight; for added-weight lifts this is the added load. */
  bwRatio: number
  added: boolean
}

/** The four "Kinobody Key Lifts" (targets for a 175-lb male). */
export const KEY_LIFTS: KeyLift[] = [
  { exerciseId: EX.inclineBench, name: 'Incline Bench Press', targetWeightLb: 250, targetReps: 6, bwRatio: 1.43, added: false },
  { exerciseId: EX.chinup, name: 'Weighted Chin-up', targetWeightLb: 120, targetReps: 4, bwRatio: 0.69, added: true },
  { exerciseId: EX.ohp, name: 'Standing Overhead Press', targetWeightLb: 185, targetReps: 5, bwRatio: 1.06, added: false },
  { exerciseId: EX.bbCurl, name: 'Barbell Curl', targetWeightLb: 145, targetReps: 6, bwRatio: 0.83, added: false },
]

export interface KeyLiftStatus {
  lift: KeyLift
  bestSet: ExerciseBests['bestSet']
  bestE1rm: number | null
  /** Absolute target expressed as e1RM (added-weight terms for chin-ups). */
  targetE1rm: number
  /** Bodyweight-relative target weight, or null without a bodyweight. */
  bwTargetWeightLb: number | null
  bwTargetE1rm: number | null
  pctAbsolute: number
  pctBodyweight: number | null
}

export function keyLiftStatus(lift: KeyLift, bests: ExerciseBests, bodyweightLb: number | null): KeyLiftStatus {
  const targetE1rm = lift.added && bodyweightLb !== null
    ? epley(bodyweightLb + lift.targetWeightLb, lift.targetReps) - bodyweightLb
    : epley(lift.targetWeightLb, lift.targetReps)
  const bwTargetWeightLb = bodyweightLb === null ? null : Math.round(bodyweightLb * lift.bwRatio)
  const bwTargetE1rm = bwTargetWeightLb === null || bodyweightLb === null
    ? null
    : lift.added
      ? epley(bodyweightLb + bwTargetWeightLb, lift.targetReps) - bodyweightLb
      : epley(bwTargetWeightLb, lift.targetReps)
  const best = bests.maxE1rm
  const pct = (target: number) => (best === null || target <= 0 ? 0 : Math.min(100, Math.round((best / target) * 100)))
  return {
    lift,
    bestSet: bests.bestSet,
    bestE1rm: best,
    targetE1rm,
    bwTargetWeightLb,
    bwTargetE1rm,
    pctAbsolute: pct(targetE1rm),
    pctBodyweight: bwTargetE1rm === null ? null : pct(bwTargetE1rm),
  }
}

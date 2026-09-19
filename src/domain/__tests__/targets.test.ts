import { describe, expect, it } from 'vitest'
import { effectiveTargets } from '../targets'
import { seedExercises, EX } from '@/db/seed/exercises'
import type { WorkoutExercise, WorkoutSet } from '@/db/types'

const bench = seedExercises.find((e) => e.id === EX.inclineBench)!
const lateral = seedExercises.find((e) => e.id === EX.lateralRaise)!
const set = (o: Partial<WorkoutSet>): WorkoutSet => ({
  id: Math.random().toString(), kind: 'working', targetWeightLb: null, targetRepMin: 4, targetRepMax: 6, targetDurationSec: null, restSec: 180,
  weightLb: null, reps: null, durationSec: null, completed: false, ...o,
})
const we = (scheme: WorkoutExercise['scheme'], sets: WorkoutSet[]): WorkoutExercise => ({ id: 'e', exerciseId: 'x', nameSnapshot: 'x', scheme, restSec: 180, sets })

describe('effectiveTargets', () => {
  it('keeps stored RPT targets until a set is logged', () => {
    const w = we('rpt', [set({ targetWeightLb: 140 }), set({ targetWeightLb: 125 }), set({ targetWeightLb: 115 })])
    expect(effectiveTargets(w, bench)).toEqual([140, 125, 115])
  })
  it('re-derives the drops from the money set actually lifted', () => {
    const w = we('rpt', [set({ targetWeightLb: 140, weightLb: 145 }), set({ targetWeightLb: 125 }), set({ targetWeightLb: 115 })])
    expect(effectiveTargets(w, bench)).toEqual([140, 130, 120])
  })
  it('derives everything from the first logged weight when nothing was known', () => {
    const w = we('rpt', [set({ weightLb: 135 }), set({}), set({})])
    expect(effectiveTargets(w, bench)).toEqual([null, 120, 110])
  })
  it('uses the previous session for the first set and chains from it', () => {
    const w = we('rpt', [set({}), set({}), set({})])
    expect(effectiveTargets(w, bench, 200)).toEqual([200, 180, 160])
  })
  it('straight sets and warm-ups follow the previous set', () => {
    const w = we('straight', [set({ kind: 'warmup', targetWeightLb: 10 }), set({ weightLb: 20 }), set({}), set({ kind: 'extra' })])
    expect(effectiveTargets(w, lateral)).toEqual([10, null, 20, 20])
  })
  it('rest-pause minis follow the activation weight', () => {
    const w = we('rest_pause', [set({ kind: 'activation', targetWeightLb: 30, weightLb: 35 }), set({ kind: 'mini', targetWeightLb: 30 }), set({ kind: 'mini', targetWeightLb: 30 })])
    expect(effectiveTargets(w, lateral)).toEqual([30, 35, 35])
  })
})

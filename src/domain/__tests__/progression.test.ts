import { describe, expect, it } from 'vitest'
import { suggestProgression } from '../progression'
import { seedExercises, EX } from '@/db/seed/exercises'
import type { WorkoutExercise, WorkoutSet } from '@/db/types'

const ex = (id: string) => seedExercises.find((e) => e.id === id)!
const set = (o: Partial<WorkoutSet>): WorkoutSet => ({
  id: 's', kind: 'working', targetWeightLb: null, targetRepMin: 4, targetRepMax: 6, targetDurationSec: null, restSec: 180,
  weightLb: null, reps: null, durationSec: null, completed: true, ...o,
})
const we = (scheme: WorkoutExercise['scheme'], sets: WorkoutSet[], exerciseId: string = EX.inclineBench): WorkoutExercise => ({
  id: 'e', exerciseId, nameSnapshot: 'x', scheme, restSec: 180, sets,
})

describe('suggestProgression', () => {
  it('adds the increment when the top set hits the top of the range', () => {
    const s = suggestProgression(we('rpt', [set({ kind: 'warmup', weightLb: 100, reps: 5 }), set({ weightLb: 200, reps: 6 }), set({ weightLb: 180, reps: 8 })]), ex(EX.inclineBench))
    expect(s).toMatchObject({ currentLb: 200, nextLb: 205, hit: true, belowRange: false })
  })
  it('holds the weight when reps are inside the range', () => {
    const s = suggestProgression(we('rpt', [set({ weightLb: 200, reps: 5 })]), ex(EX.inclineBench))
    expect(s).toMatchObject({ currentLb: 200, nextLb: 200, hit: false, belowRange: false })
  })
  it('flags below-range top sets', () => {
    const s = suggestProgression(we('rpt', [set({ weightLb: 200, reps: 3 })]), ex(EX.inclineBench))
    expect(s).toMatchObject({ hit: false, belowRange: true })
  })
  it('uses 2.5 lb for dumbbell/cable/weighted bodyweight', () => {
    const s = suggestProgression(we('rpt', [set({ weightLb: 45, reps: 6 })], EX.chinup), ex(EX.chinup))
    expect(s?.nextLb).toBe(47.5)
  })
  it('straight sets need every set at the top', () => {
    const ok = suggestProgression(we('straight', [set({ weightLb: 20, reps: 15, targetRepMin: 8, targetRepMax: 15 }), set({ weightLb: 20, reps: 15, targetRepMin: 8, targetRepMax: 15 })], EX.lateralRaise), ex(EX.lateralRaise))
    expect(ok?.hit).toBe(true)
    const no = suggestProgression(we('straight', [set({ weightLb: 20, reps: 15, targetRepMin: 8, targetRepMax: 15 }), set({ weightLb: 20, reps: 12, targetRepMin: 8, targetRepMax: 15 })], EX.lateralRaise), ex(EX.lateralRaise))
    expect(no?.hit).toBe(false)
  })
  it('rest-pause uses the activation set', () => {
    const s = suggestProgression(we('rest_pause', [set({ kind: 'activation', weightLb: 30, reps: 15, targetRepMin: 12, targetRepMax: 15 }), set({ kind: 'mini', weightLb: 30, reps: 4, targetRepMin: 3, targetRepMax: 5 })], EX.lateralRaise), ex(EX.lateralRaise))
    expect(s).toMatchObject({ currentLb: 30, nextLb: 32.5, hit: true })
  })
  it('ignores bodyweight and timed exercises', () => {
    expect(suggestProgression(we('straight', [set({ reps: 12 })], EX.hangingLegRaise), ex(EX.hangingLegRaise))).toBeNull()
    expect(suggestProgression(we('timed', [set({ durationSec: 30 })], EX.plank), ex(EX.plank))).toBeNull()
  })
})

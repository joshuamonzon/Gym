import { describe, expect, it } from 'vitest'
import { buildWorkoutDraft } from '../buildWorkoutDraft'
import { defaultSettings, seedExercises, seedPrograms, seedRoutines, RT, PH, EX } from '@/db/seed'
import { warmupSets } from '../warmups'
import { finalizeWorkout, pruneIncomplete } from '../workoutMath'
import { flagPrs } from '../prs'

const exercisesById = Object.fromEntries(seedExercises.map((e) => [e.id, e]))
const routine = seedRoutines.find((r) => r.id === RT.a)!
const phase1 = seedPrograms[0].phases.find((p) => p.id === PH.one)!
const phase2 = seedPrograms[0].phases.find((p) => p.id === PH.two)!

describe('warmupSets', () => {
  it('50% x5 and 75% x3 rounded', () => {
    expect(warmupSets(200, 5, 'external')).toEqual([{ weightLb: 100, reps: 5 }, { weightLb: 150, reps: 3 }])
    expect(warmupSets(45, 5, 'external')).toEqual([{ weightLb: 25, reps: 5 }, { weightLb: 35, reps: 3 }])
    expect(warmupSets(null, 5, 'external')).toEqual([])
    expect(warmupSets(50, 2.5, 'bodyweight_plus')).toEqual([{ weightLb: 0, reps: 5 }, { weightLb: 25, reps: 3 }])
    expect(warmupSets(10, 0, 'bodyweight')).toEqual([])
  })
})

describe('buildWorkoutDraft', () => {
  const settings = defaultSettings(0)
  it('pre-fills RPT targets from progress and adds warm-ups', () => {
    const w = buildWorkoutDraft({
      routine, exercisesById, settings, phase: phase1, now: 1_000,
      progressById: { [EX.inclineBench]: { exerciseId: EX.inclineBench, workingWeightLb: 195, nextWorkingWeightLb: 200, lastPerformedAt: 0, updatedAt: 0 } },
      lastTopSetLb: { [EX.ohp]: 120 },
    })
    expect(w.routineId).toBe(RT.a)
    expect(w.phaseId).toBe(PH.one)
    const bench = w.exercises[0]
    expect(bench.sets.map((s) => [s.kind, s.targetWeightLb, s.targetRepMax])).toEqual([
      ['warmup', 100, 5], ['warmup', 150, 3], ['working', 200, 6], ['working', 180, 8], ['working', 160, 10],
    ])
    expect(bench.sets.every((s) => s.restSec === (s.kind === 'warmup' ? 60 : 180))).toBe(true)
    const ohp = w.exercises[1]
    expect(ohp.sets.filter((s) => s.kind === 'working').map((s) => s.targetWeightLb)).toEqual([120, 110, 100])
    const dips = w.exercises[2]
    expect(dips.sets.filter((s) => s.kind === 'working').map((s) => s.targetWeightLb)).toEqual([null, null, null])
    expect(dips.sets.filter((s) => s.kind === 'warmup')).toHaveLength(0)
    expect(w.exerciseIds).toHaveLength(5)
  })
  it('adds Phase Two extra sets to the chosen exercise only', () => {
    const w = buildWorkoutDraft({
      routine, exercisesById, phase: phase2, now: 1_000, progressById: {}, lastTopSetLb: {},
      settings: { ...settings, autoWarmups: false, specialization: { [RT.a]: EX.ohp } },
    })
    const ohp = w.exercises.find((e) => e.exerciseId === EX.ohp)!
    expect(ohp.sets.map((s) => s.kind)).toEqual(['working', 'working', 'working', 'extra', 'extra'])
    expect(ohp.sets[3].targetRepMax).toBe(10)
    expect(w.exercises[0].sets).toHaveLength(3)
  })
  it('rest-pause rows carry 20 s rest on mini sets', () => {
    const mega = seedRoutines.find((r) => r.id === RT.megaA)!
    const w = buildWorkoutDraft({ routine: mega, exercisesById, phase: undefined, now: 0, progressById: {}, lastTopSetLb: {}, settings: { ...settings, autoWarmups: false } })
    const lat = w.exercises.find((e) => e.exerciseId === EX.lateralRaise)!
    expect(lat.sets.map((s) => [s.kind, s.restSec])).toEqual([['activation', 20], ['mini', 20], ['mini', 20], ['mini', 20]])
  })
})

describe('finalize / prune / PRs', () => {
  const settings = defaultSettings(0)
  it('computes volume, reps, duration and flags PRs against history', () => {
    const w = buildWorkoutDraft({ routine, exercisesById, settings: { ...settings, autoWarmups: false }, phase: phase1, now: 0, progressById: {}, lastTopSetLb: { [EX.inclineBench]: 200 } })
    const bench = w.exercises[0]
    bench.sets[0] = { ...bench.sets[0], weightLb: 200, reps: 6, completed: true }
    bench.sets[1] = { ...bench.sets[1], weightLb: 180, reps: 8, completed: true }
    const pruned = pruneIncomplete({ ...w, finishedAt: 3_600_000 })
    expect(pruned.exercises).toHaveLength(1)
    expect(pruned.exercises[0].sets).toHaveLength(2)
    const history = [finalizeWorkout({ ...pruned, id: 'old', startedAt: -10, finishedAt: -5, exercises: [{ ...bench, sets: [{ ...bench.sets[0], weightLb: 195, reps: 6 }] }] })]
    const flagged = finalizeWorkout(flagPrs(pruned, history, exercisesById, null))
    expect(flagged.volumeLb).toBe(200 * 6 + 180 * 8)
    expect(flagged.totalReps).toBe(14)
    expect(flagged.durationSec).toBe(3600)
    expect(flagged.exercises[0].sets[0].prs).toEqual(['weight', 'e1rm', 'volume'])
    // 180 x 8 moves more in one set than any prior set: a set-volume record.
    expect(flagged.exercises[0].sets[1].prs).toEqual(['volume'])
    expect(flagged.prCount).toBe(2)
  })
})

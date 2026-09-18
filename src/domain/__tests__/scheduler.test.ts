import { describe, expect, it } from 'vitest'
import { nextRoutineId, todayPlan, weekStrip, weeklyMuscleSessions } from '../scheduler'
import { defaultSettings, seedPrograms, seedRoutines, seedExercises, RT, PH, EX } from '@/db/seed'
import type { Workout } from '@/db/types'
import { parseLocalDate } from '../dates'

const program = seedPrograms[0]
const phase1 = program.phases.find((p) => p.id === PH.one)!
const phaseAdv = program.phases.find((p) => p.id === PH.advanced)!
const routinesById = Object.fromEntries(seedRoutines.map((r) => [r.id, r]))
const exercisesById = Object.fromEntries(seedExercises.map((e) => [e.id, e]))

function done(localDate: string, routineId: string, hour = 9, exerciseIds: string[] = []): Workout {
  const start = parseLocalDate(localDate).getTime() + hour * 3_600_000
  return {
    id: `w_${localDate}_${routineId}`, title: routinesById[routineId].name, routineId, routineName: routinesById[routineId].name,
    startedAt: start, finishedAt: start + 3_600_000, localDate, durationSec: 3600, volumeLb: 0, totalReps: 0, prCount: 0,
    exercises: exerciseIds.map((id) => ({ id: 'e' + id, exerciseId: id, nameSnapshot: id, scheme: 'straight', restSec: 60, sets: [{ id: 's', kind: 'working', targetWeightLb: null, targetRepMin: null, targetRepMax: null, targetDurationSec: null, restSec: 60, weightLb: null, reps: 10, durationSec: null, completed: true }] })),
    exerciseIds, source: 'app',
  }
}

// 2026-09-14 is a Monday.
const settings = defaultSettings(0)
const base = { settings, phase: phase1, routinesById, now: parseLocalDate('2026-09-16').getTime() + 12 * 3_600_000 }

describe('nextRoutineId', () => {
  it('starts at A, alternates, and honours an override', () => {
    expect(nextRoutineId(phase1, null, null)).toBe(RT.a)
    expect(nextRoutineId(phase1, RT.a, null)).toBe(RT.b)
    expect(nextRoutineId(phase1, RT.b, null)).toBe(RT.a)
    expect(nextRoutineId(phase1, RT.a, RT.a)).toBe(RT.a)
  })
})

describe('todayPlan', () => {
  it('continues the rotation on a training day: finished A on Mon → Wed shows B', () => {
    const plan = todayPlan({ ...base, today: '2026-09-16', workouts: [done('2026-09-14', RT.a)] })
    expect(plan.kind).toBe('train')
    expect(plan.routineId).toBe(RT.b)
    expect(plan.warn48h).toBe(false)
  })
  it('a missed day does not advance the rotation: skip Wed → Fri still shows B', () => {
    const plan = todayPlan({ ...base, today: '2026-09-18', now: parseLocalDate('2026-09-18').getTime() + 12 * 3_600_000, workouts: [done('2026-09-14', RT.a)] })
    expect(plan.routineId).toBe(RT.b)
  })
  it('rest day names the next routine and date', () => {
    const plan = todayPlan({ ...base, today: '2026-09-15', workouts: [done('2026-09-14', RT.a)] })
    expect(plan.kind).toBe('rest')
    expect(plan.routineId).toBe(RT.b)
    expect(plan.nextDate).toBe('2026-09-16')
  })
  it('warns when training again within 48 hours', () => {
    const plan = todayPlan({ ...base, today: '2026-09-16', now: parseLocalDate('2026-09-16').getTime() + 12 * 3_600_000, workouts: [done('2026-09-15', RT.a, 20)] })
    expect(plan.warn48h).toBe(true)
  })
  it('reports done when already trained today', () => {
    const plan = todayPlan({ ...base, today: '2026-09-16', workouts: [done('2026-09-16', RT.b)] })
    expect(plan.kind).toBe('done')
    expect(plan.nextDate).toBe('2026-09-18')
  })
  it('override wins and is reported', () => {
    const plan = todayPlan({ ...base, settings: { ...settings, nextOverrideRoutineId: RT.a }, today: '2026-09-16', workouts: [done('2026-09-14', RT.a)] })
    expect(plan.routineId).toBe(RT.a)
    expect(plan.overridden).toBe(true)
  })
  it('pinned weekdays map directly (advanced split)', () => {
    const wed = todayPlan({ ...base, phase: phaseAdv, today: '2026-09-16', workouts: [] })
    expect(wed.kind).toBe('train')
    expect(wed.routineId).toBe(RT.advWed)
    const tue = todayPlan({ ...base, phase: phaseAdv, today: '2026-09-15', workouts: [] })
    expect(tue.kind).toBe('rest')
    expect(tue.routineId).toBe(RT.advWed)
    expect(tue.nextDate).toBe('2026-09-16')
  })
})

describe('weekStrip', () => {
  it('shows done, missed, planned and rest days with the projected rotation', () => {
    // Mon done (A), Wed missed (today is Thu), Fri planned B
    const days = weekStrip({ ...base, today: '2026-09-17', workouts: [done('2026-09-14', RT.a)] })
    expect(days.map((d) => d.status)).toEqual(['done', 'rest', 'missed', 'rest', 'planned', 'rest', 'rest'])
    expect(days[4].label).toBe('B')
    expect(days[0].label).toBe('A')
  })
  it('does not mark days before the first workout as missed', () => {
    const days = weekStrip({ ...base, today: '2026-09-17', workouts: [done('2026-09-16', RT.a)] })
    expect(days.map((d) => d.status)).toEqual(['rest', 'rest', 'done', 'rest', 'planned', 'rest', 'rest'])
    const fresh = weekStrip({ ...base, today: '2026-09-17', workouts: [] })
    expect(fresh.map((d) => d.status)).toEqual(['rest', 'rest', 'rest', 'rest', 'planned', 'rest', 'rest'])
  })
  it('projects alternation across the week when nothing is done yet', () => {
    const days = weekStrip({ ...base, today: '2026-09-14', workouts: [done('2026-09-11', RT.b)] })
    expect(days.filter((d) => d.status === 'planned').map((d) => d.label)).toEqual(['A', 'B', 'A'])
  })
})

describe('weeklyMuscleSessions', () => {
  it('counts sessions with a completed abs exercise this week', () => {
    const w = [done('2026-09-14', RT.a, 9, [EX.hangingLegRaise]), done('2026-09-16', RT.b, 9, [EX.bbCurl])]
    const r = weeklyMuscleSessions(w, exercisesById, 'abs', '2026-09-17', 1, 2)
    expect(r).toEqual({ done: 1, target: 2, due: true })
  })
})

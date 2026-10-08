import { describe, expect, it } from 'vitest'
import { DaySchema, ConfigSchema } from '../schema'

describe('DaySchema', () => {
  it('accepts the spec example', () => {
    const r = DaySchema.safeParse({
      date: '2026-10-02',
      weight_lb: 171.2,
      cals: 2650,
      protein_g: 180,
      carbs_g: 310,
      sleep_h: 6.5,
      shift: false,
      run: { miles: 3.1, seconds: 2295, avg_hr: 126, surface: 'treadmill' },
      bike_min: 40,
      lifts: [{ lift: 'leg_press', weight: 270, reps: 10 }],
      note: 'leg slightly better than Day 1, low constant ache',
    })
    expect(r.success).toBe(true)
  })
  it('requires only date', () => {
    expect(DaySchema.safeParse({ date: '2026-10-05' }).success).toBe(true)
  })
  it('rejects unknown fields, nulls, bad dates and non-integer seconds', () => {
    expect(DaySchema.safeParse({ date: '2026-10-05', cadence: 170 }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-10-05', cals: null }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-13-05' }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '10/05/2026' }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-10-05', run: { seconds: 2295.5 } }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-10-05', run: { miles: 3.1, max_hr: 170 } }).success).toBe(false)
  })
  it('allows lift names the UI ignores (validate warns, UI drops them)', () => {
    expect(DaySchema.safeParse({ date: '2026-10-05', lifts: [{ lift: 'curl', weight: 40, reps: 10 }] }).success).toBe(true)
  })
})

describe('ConfigSchema', () => {
  it('accepts the seed config and rejects other week starts', () => {
    const cfg = {
      challenge: { name: 'October 5K', start: '2026-10-01', end: '2026-10-31' },
      tracked_lifts: ['bench', 'pullup', 'row', 'leg_press'],
      start_weight_lb: 167.4,
      week_start: 'monday',
    }
    expect(ConfigSchema.safeParse(cfg).success).toBe(true)
    expect(ConfigSchema.safeParse({ ...cfg, week_start: 'sunday' }).success).toBe(false)
  })
})

describe('plan', () => {
  it('accepts a full plan with numeric and string set values', () => {
    const r = DaySchema.safeParse({
      date: '2026-10-08',
      plan: {
        cardio: { type: 'bike', label: 'Kickr Zone 2', target: 'HR ≤135', duration_min: 40 },
        lift: {
          name: 'Upper — strength',
          exercises: [
            { name: 'Bench', sets: [{ w: 45, r: 10, warmup: true }, { w: 225, r: 5 }], rest_s: 180 },
            { name: 'Pull-ups', note: 'BW', sets: [{ w: 'BW', r: 'max', note: 'target 10' }, { w: '+45', r: 'to failure' }] },
          ],
          notes: ['No hamstring loading'],
        },
      },
    })
    expect(r.success).toBe(true)
  })
  it('rejects unknown cardio types and unknown keys', () => {
    expect(DaySchema.safeParse({ date: '2026-10-08', plan: { cardio: { type: 'swim' } } }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-10-08', plan: { lift: { exercises: [{ name: 'Bench', sets: [{ w: 225, r: 5, rpe: 8 }] }] } } }).success).toBe(false)
    expect(DaySchema.safeParse({ date: '2026-10-08', plan: { mobility: true } }).success).toBe(false)
  })
})

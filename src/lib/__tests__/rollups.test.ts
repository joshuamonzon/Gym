import { describe, expect, it } from 'vitest'
import type { Config, Day } from '../schema'
import {
  aerobicEfficiency,
  bodyweightOn,
  challengeStreak,
  dailyE1rm,
  e1rmFor,
  epley,
  nowStats,
  paceSecPerMile,
  runCalories,
  weeklyRollups,
  weightSeries,
} from '../rollups'
import { weekStartOf, addDays, daysBetween } from '../dates'
import config from '../../../data/config.json'
import d1 from './fixtures/2026-10-01.json'
import d2 from './fixtures/2026-10-02.json'
import d3 from './fixtures/2026-10-03.json'

const cfg = config as Config
const seed = [d1, d2, d3] as Day[]

describe('dates', () => {
  it('finds the Monday of a week', () => {
    expect(weekStartOf('2026-10-01')).toBe('2026-09-28') // Thu → Mon
    expect(weekStartOf('2026-09-28')).toBe('2026-09-28') // Mon
    expect(weekStartOf('2026-10-04')).toBe('2026-09-28') // Sun belongs to the preceding Monday
    expect(weekStartOf('2026-10-05')).toBe('2026-10-05')
  })
  it('adds and diffs days across a month boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30)
  })
})

describe('per-run metrics', () => {
  it('pace is seconds per mile', () => {
    expect(paceSecPerMile({ miles: 3.1, seconds: 2295 })).toBeCloseTo(740.32, 2)
    expect(paceSecPerMile({ miles: 3.1 })).toBeUndefined()
  })
  it('aerobic efficiency is speed (m/min) / HR', () => {
    // 3.18 mi = 5117.714 m over 40.0167 min = 127.89 m/min; / 128 bpm
    expect(aerobicEfficiency({ miles: 3.18, seconds: 2401, avg_hr: 128 })).toBeCloseTo(0.99914, 4)
    expect(aerobicEfficiency({ miles: 3.1, seconds: 2295, avg_hr: 126 })).toBeCloseTo(1.03516, 4)
    expect(aerobicEfficiency({ miles: 3.1, seconds: 2295 })).toBeUndefined()
  })
})

describe('e1RM', () => {
  it('uses Epley', () => {
    expect(epley(225, 5)).toBeCloseTo(262.5)
    expect(epley(270, 10)).toBeCloseTo(360)
    expect(epley(100, 1)).toBeCloseTo(103.333, 3)
  })
  it('adds bodyweight for pull-ups only', () => {
    expect(e1rmFor({ lift: 'pullup', weight: 50, reps: 5 }, 167.4)).toBeCloseTo(253.633, 3)
    expect(e1rmFor({ lift: 'row', weight: 165, reps: 5 }, 167.4)).toBeCloseTo(192.5)
  })
  it('bodyweight is the latest logged weight on/before the date, else start weight', () => {
    expect(bodyweightOn('2026-10-01', seed, cfg)).toBe(167.4) // no weigh-in yet → start_weight_lb
    const days: Day[] = [...seed, { date: '2026-10-05', weight_lb: 166.0 }]
    expect(bodyweightOn('2026-10-04', days, cfg)).toBe(167.4)
    expect(bodyweightOn('2026-10-05', days, cfg)).toBe(166.0)
    expect(bodyweightOn('2026-10-09', days, cfg)).toBe(166.0)
  })
  it('takes the best e1RM when a lift appears twice in a day', () => {
    const days: Day[] = [
      {
        date: '2026-10-06',
        lifts: [
          { lift: 'bench', weight: 225, reps: 3 }, // 247.5
          { lift: 'bench', weight: 205, reps: 8 }, // 259.67
        ],
      },
    ]
    expect(dailyE1rm('bench', days, cfg)).toEqual([{ date: '2026-10-06', e1rm: expect.closeTo(259.667, 2) }])
  })
})

describe('weekly rollup — Oct 1–3 seed data, by hand', () => {
  const weeks = weeklyRollups(seed, cfg)
  const w = weeks[0]

  it('is exactly one week, Mon Sep 28 – Sun Oct 4', () => {
    expect(weeks).toHaveLength(1)
    expect(w.start).toBe('2026-09-28')
    expect(w.end).toBe('2026-10-04')
    expect(w.days.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
  })

  it('weight: only Oct 3 logged → 167.4, no prior week → no Δ', () => {
    expect(w.avgWeight).toBeCloseTo(167.4)
    expect(w.deltaWeight).toBeUndefined()
  })

  it('fuel: nothing logged → undefined, not 0', () => {
    expect(w.avgCals).toBeUndefined()
    expect(w.avgProtein).toBeUndefined()
    expect(w.avgCarbs).toBeUndefined()
  })

  it('running: 3.18 + 3.10 = 6.28 mi; (2401+2295)/6.28 s/mi; HR (128+126)/2', () => {
    expect(w.totalMiles).toBeCloseTo(6.28, 5)
    expect(w.avgPace).toBeCloseTo(4696 / 6.28, 5) // 747.77 s/mi = 12:28 /mi
    expect(w.avgRunHr).toBe(127)
    expect(w.runDays).toBe(2)
  })

  it('est burn: 0.63 × 167.4 lb × 6.28 mi = 662.3 kcal (no weigh-in before Oct 3 → start weight)', () => {
    expect(runCalories({ miles: 3.18 }, 167.4)).toBeCloseTo(335.4, 1)
    expect(runCalories(undefined, 167.4)).toBeUndefined()
    expect(w.estBurn).toBeCloseTo(0.63 * 167.4 * 6.28, 3)
  })

  it('efficiency is the mean of the two runs: (0.99914 + 1.03516) / 2', () => {
    expect(w.efficiency).toBeCloseTo((0.999137 + 1.035163) / 2, 4)
    expect(w.efficiency).toBeCloseTo(1.01715, 4)
  })

  it('shift days 0; sleep (7.27 + 7.2 + 7.58) / 3 = 7.35', () => {
    expect(w.shiftDays).toBe(0)
    expect(w.avgSleep).toBeCloseTo(7.35, 5)
  })

  it('lifts: bench 225×5 → 262.5, pull-up +50×5 @167.4 bw → 253.63, row 165×5 → 192.5, leg press 270×10 → 360', () => {
    expect(w.lifts.bench).toMatchObject({ date: '2026-10-01', weight: 225, reps: 5 })
    expect(w.lifts.bench!.e1rm).toBeCloseTo(262.5)
    expect(w.lifts.pullup).toMatchObject({ weight: 50, reps: 5 })
    expect(w.lifts.pullup!.e1rm).toBeCloseTo(217.4 * (7 / 6), 3)
    expect(w.lifts.row!.e1rm).toBeCloseTo(192.5)
    expect(w.lifts.leg_press).toMatchObject({ date: '2026-10-02', weight: 270, reps: 10 })
    expect(w.lifts.leg_press!.e1rm).toBeCloseTo(360)
    for (const lift of cfg.tracked_lifts) expect(w.liftDelta[lift]).toBeUndefined()
  })
})

describe('weekly rollup — deltas vs prior week', () => {
  const next: Day[] = [
    { date: '2026-10-05', weight_lb: 166.4, cals: 2600, shift: true, lifts: [{ lift: 'bench', weight: 230, reps: 5 }] },
    { date: '2026-10-06', weight_lb: 166.0, cals: 2400, run: { miles: 3.1, seconds: 2200, avg_hr: 124 } },
  ]
  const weeks = weeklyRollups([...seed, ...next], cfg)

  it('is newest first', () => {
    expect(weeks.map((w) => w.start)).toEqual(['2026-10-05', '2026-09-28'])
  })
  it('Δ weight = 166.2 − 167.4 = −1.2', () => {
    expect(weeks[0].avgWeight).toBeCloseTo(166.2)
    expect(weeks[0].deltaWeight).toBeCloseTo(-1.2)
    expect(weeks[0].avgCals).toBe(2500)
    expect(weeks[0].shiftDays).toBe(1)
  })
  it('bench e1RM Δ = 230×7/6 − 262.5 = +5.83; others undefined (no set this week)', () => {
    expect(weeks[0].liftDelta.bench).toBeCloseTo(230 * (7 / 6) - 262.5, 3)
    expect(weeks[0].liftDelta.pullup).toBeUndefined()
    expect(weeks[0].lifts.pullup).toBeUndefined()
  })
})

describe('weight series', () => {
  it('fills every calendar day and uses a trailing 7-day window', () => {
    const days: Day[] = [
      { date: '2026-10-01', weight_lb: 170 },
      { date: '2026-10-03', weight_lb: 168, shift: true },
      { date: '2026-10-09', weight_lb: 166 },
    ]
    const s = weightSeries(days)
    expect(s).toHaveLength(9)
    expect(s[0]).toEqual({ date: '2026-10-01', weight: 170, avg7: 170, shift: false })
    expect(s[1]).toEqual({ date: '2026-10-02', weight: undefined, avg7: 170, shift: false })
    expect(s[2]).toEqual({ date: '2026-10-03', weight: 168, avg7: 169, shift: true })
    // Oct 8: window Oct 2–8 holds only Oct 3
    expect(s[7].avg7).toBe(168)
    // Oct 9: window Oct 3–9 → (168 + 166) / 2
    expect(s[8].avg7).toBe(167)
  })
})

describe('challenge streak', () => {
  it('counts back from yesterday; today adds 1 only if its run is in', () => {
    expect(challengeStreak(seed, cfg, '2026-10-02')).toBe(2)
    expect(challengeStreak(seed, cfg, '2026-10-03')).toBe(2) // Oct 3 has no run yet, doesn't break
    expect(challengeStreak(seed, cfg, '2026-10-04')).toBe(0) // Oct 3 is now a missed day
    expect(challengeStreak(seed, cfg, '2026-09-30')).toBe(0)
  })
  it('requires ≥ 3.1 mi', () => {
    const days: Day[] = [
      { date: '2026-10-01', run: { miles: 3.1 } },
      { date: '2026-10-02', run: { miles: 3.0 } },
      { date: '2026-10-03', run: { miles: 3.2 } },
    ]
    expect(challengeStreak(days, cfg, '2026-10-03')).toBe(1)
  })
})

describe('now stats — seed data on 2026-10-03', () => {
  const n = nowStats(seed, cfg, '2026-10-03')
  it('weight', () => {
    expect(n.latestWeight).toEqual({ date: '2026-10-03', weight: 167.4 })
    expect(n.deltaFromStart).toBeCloseTo(0)
    expect(n.avg7Weight).toBeCloseTo(167.4)
    expect(n.avg7Cals).toBeUndefined()
    expect(n.avg7Carbs).toBeUndefined()
  })
  it('challenge day 3/31, streak 2', () => {
    expect(n.challengeDay).toBe(3)
    expect(n.challengeLength).toBe(31)
    expect(n.streak).toBe(2)
  })
  it('best 5K = 2295 s (Oct 2); bench e1RM 262.5', () => {
    expect(n.best5kSeconds).toBe(2295)
    expect(n.benchE1rm).toBeCloseTo(262.5)
  })
  it('this week so far: 6.28 mi, 2 run days, 2 lift days', () => {
    expect(n.thisWeek.miles).toBeCloseTo(6.28, 5)
    expect(n.thisWeek.runDays).toBe(2)
    expect(n.thisWeek.liftDays).toBe(2)
    expect(n.thisWeek.estBurn).toBeCloseTo(0.63 * 167.4 * 6.28, 3)
  })
})

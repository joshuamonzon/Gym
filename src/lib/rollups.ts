/**
 * Pure rollup math. No React, no I/O. Everything the screens show that isn't
 * raw day data is computed here.
 */
import type { Config, Day, LiftSet, Run } from './schema'
import { addDays, daysBetween, weekStartOf } from './dates'

export const METERS_PER_MILE = 1609.344
export const FIVE_K_MILES = 3.1

// ---------- small helpers ----------

export function mean(xs: number[]): number | undefined {
  if (xs.length === 0) return undefined
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

function defined<T>(xs: (T | undefined)[]): T[] {
  return xs.filter((x): x is T => x !== undefined)
}

export function sortByDate(days: Day[]): Day[] {
  return [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

// ---------- per-run metrics ----------

/** Pace in seconds per mile. */
export function paceSecPerMile(run: Run): number | undefined {
  if (!run.miles || !run.seconds) return undefined
  return run.seconds / run.miles
}

/** Aerobic efficiency: speed (m/min) / avg HR. Higher is fitter. */
export function aerobicEfficiency(run: Run): number | undefined {
  if (!run.miles || !run.seconds || !run.avg_hr) return undefined
  const metersPerMin = (run.miles * METERS_PER_MILE) / (run.seconds / 60)
  return metersPerMin / run.avg_hr
}

/**
 * Estimated calories burned by a run: 0.63 kcal per lb of bodyweight per mile
 * (the common net-of-resting estimate). Rough by design — no HR or grade term.
 */
export const KCAL_PER_LB_MILE = 0.63
export function runCalories(run: Run | undefined, bodyweightLb: number): number | undefined {
  if (!run?.miles) return undefined
  return KCAL_PER_LB_MILE * bodyweightLb * run.miles
}

/** Sum of estimated run burn across days, using each day's bodyweight. */
export function totalRunCalories(days: Day[], allDays: Day[], config: Config): number {
  return sum(defined(days.map((d) => runCalories(d.run, bodyweightOn(d.date, allDays, config)))))
}

export function isChallengeRun(run: Run | undefined): run is Run {
  return !!run && (run.miles ?? 0) >= FIVE_K_MILES
}

// ---------- lifts ----------

/** Epley: w × (1 + reps/30). */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

/**
 * Bodyweight used for pull-up e1RM on a given date: the latest logged weight on
 * or before that date, else start_weight_lb.
 */
export function bodyweightOn(date: string, days: Day[], config: Config): number {
  let bw = config.start_weight_lb
  for (const d of sortByDate(days)) {
    if (d.date > date) break
    if (d.weight_lb !== undefined) bw = d.weight_lb
  }
  return bw
}

export function e1rmFor(set: LiftSet, bodyweight: number): number {
  const load = set.lift === 'pullup' ? bodyweight + set.weight : set.weight
  return epley(load, set.reps)
}

export interface TopSet {
  date: string
  lift: string
  weight: number
  reps: number
  e1rm: number
}

/** Best (by e1RM) set for one lift across the given days. */
export function bestTopSet(lift: string, days: Day[], allDays: Day[], config: Config): TopSet | undefined {
  let best: TopSet | undefined
  for (const d of days) {
    for (const s of d.lifts ?? []) {
      if (s.lift !== lift) continue
      const e1rm = e1rmFor(s, bodyweightOn(d.date, allDays, config))
      if (!best || e1rm > best.e1rm) best = { date: d.date, lift, weight: s.weight, reps: s.reps, e1rm }
    }
  }
  return best
}

/** Per-day best e1RM for a lift (for the Lifts chart). */
export function dailyE1rm(lift: string, days: Day[], config: Config): { date: string; e1rm: number }[] {
  const out: { date: string; e1rm: number }[] = []
  for (const d of sortByDate(days)) {
    const top = bestTopSet(lift, [d], days, config)
    if (top) out.push({ date: d.date, e1rm: top.e1rm })
  }
  return out
}

// ---------- weekly rollups ----------

export interface WeekRollup {
  /** Monday */
  start: string
  /** Sunday */
  end: string
  days: Day[]
  avgWeight?: number
  /** avgWeight minus prior week's avgWeight (only when both exist) */
  deltaWeight?: number
  avgCals?: number
  avgProtein?: number
  avgCarbs?: number
  totalMiles: number
  /** total run seconds / total run miles, in seconds per mile */
  avgPace?: number
  avgRunHr?: number
  /** mean of per-run aerobic efficiency */
  efficiency?: number
  runDays: number
  /** estimated calories burned by this week's runs */
  estBurn: number
  shiftDays: number
  avgSleep?: number
  /** keyed by tracked lift */
  lifts: Record<string, TopSet | undefined>
  /** e1RM minus prior week's e1RM for the same lift (only when both exist) */
  liftDelta: Record<string, number | undefined>
}

export function rollupWeek(start: string, days: Day[], allDays: Day[], config: Config): Omit<WeekRollup, 'deltaWeight' | 'liftDelta'> {
  const runs = defined(days.map((d) => d.run))
  const timed = runs.filter((r) => r.miles && r.seconds)
  const totalMiles = sum(defined(runs.map((r) => r.miles)))
  const timedMiles = sum(timed.map((r) => r.miles!))
  const timedSeconds = sum(timed.map((r) => r.seconds!))
  const lifts: Record<string, TopSet | undefined> = {}
  for (const lift of config.tracked_lifts) lifts[lift] = bestTopSet(lift, days, allDays, config)
  return {
    start,
    end: addDays(start, 6),
    days: sortByDate(days),
    avgWeight: mean(defined(days.map((d) => d.weight_lb))),
    avgCals: mean(defined(days.map((d) => d.cals))),
    avgProtein: mean(defined(days.map((d) => d.protein_g))),
    avgCarbs: mean(defined(days.map((d) => d.carbs_g))),
    totalMiles,
    avgPace: timedMiles > 0 ? timedSeconds / timedMiles : undefined,
    avgRunHr: mean(defined(runs.map((r) => r.avg_hr))),
    efficiency: mean(defined(runs.map(aerobicEfficiency))),
    runDays: runs.length,
    estBurn: totalRunCalories(days, allDays, config),
    shiftDays: days.filter((d) => d.shift === true).length,
    avgSleep: mean(defined(days.map((d) => d.sleep_h))),
    lifts,
  }
}

/** All weeks that contain at least one day file, newest first, with deltas vs the prior rolled-up week. */
export function weeklyRollups(days: Day[], config: Config): WeekRollup[] {
  const byWeek = new Map<string, Day[]>()
  for (const d of days) {
    const ws = weekStartOf(d.date)
    byWeek.set(ws, [...(byWeek.get(ws) ?? []), d])
  }
  const starts = [...byWeek.keys()].sort()
  const out: WeekRollup[] = []
  let prev: WeekRollup | undefined
  for (const start of starts) {
    const base = rollupWeek(start, byWeek.get(start)!, days, config)
    const liftDelta: Record<string, number | undefined> = {}
    for (const lift of config.tracked_lifts) {
      const cur = base.lifts[lift]?.e1rm
      const was = prev?.lifts[lift]?.e1rm
      liftDelta[lift] = cur !== undefined && was !== undefined ? cur - was : undefined
    }
    const week: WeekRollup = {
      ...base,
      deltaWeight:
        base.avgWeight !== undefined && prev?.avgWeight !== undefined ? base.avgWeight - prev.avgWeight : undefined,
      liftDelta,
    }
    out.push(week)
    prev = week
  }
  return out.reverse()
}

// ---------- daily series ----------

export interface WeightPoint {
  date: string
  weight?: number
  /** mean of logged weights in the 7 days ending on `date` (inclusive) */
  avg7?: number
  shift: boolean
}

/** One point per calendar day from first to last day file, with the trailing 7-day weight average. */
export function weightSeries(days: Day[]): WeightPoint[] {
  const sorted = sortByDate(days)
  if (sorted.length === 0) return []
  const byDate = new Map(sorted.map((d) => [d.date, d]))
  const first = sorted[0].date
  const last = sorted[sorted.length - 1].date
  const out: WeightPoint[] = []
  for (let i = 0; i <= daysBetween(first, last); i++) {
    const date = addDays(first, i)
    const window: number[] = []
    for (let k = 0; k < 7; k++) {
      const w = byDate.get(addDays(date, -k))?.weight_lb
      if (w !== undefined) window.push(w)
    }
    const d = byDate.get(date)
    out.push({ date, weight: d?.weight_lb, avg7: mean(window), shift: d?.shift === true })
  }
  return out
}

// ---------- "Now" ----------

export interface NowStats {
  latestWeight?: { date: string; weight: number }
  deltaFromStart?: number
  avg7Weight?: number
  avg7Cals?: number
  avg7Carbs?: number
  /** 1-based day of challenge; undefined before start */
  challengeDay?: number
  challengeLength: number
  streak: number
  /** seconds of the fastest run ≥ 3.1 mi in the calendar month of `today` */
  best5kSeconds?: number
  benchE1rm?: number
  thisWeek: { miles: number; runDays: number; liftDays: number; estBurn: number }
}

/**
 * Consecutive days with a run ≥ 3.1 mi since challenge.start, counted back from
 * yesterday. Today adds 1 if its run is already logged, but never breaks the
 * streak (the day isn't over).
 */
export function challengeStreak(days: Day[], config: Config, today: string): number {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const start = config.challenge.start
  if (today < start) return 0
  let n = isChallengeRun(byDate.get(today)?.run) ? 1 : 0
  let cursor = addDays(today, -1)
  while (cursor >= start) {
    if (!isChallengeRun(byDate.get(cursor)?.run)) break
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function nowStats(days: Day[], config: Config, today: string): NowStats {
  const sorted = sortByDate(days)
  const weighed = sorted.filter((d) => d.weight_lb !== undefined)
  const latest = weighed[weighed.length - 1]
  const last7 = sorted.filter((d) => d.date <= today && d.date > addDays(today, -7))
  const month = today.slice(0, 7)
  const monthRuns = sorted.filter((d) => d.date.startsWith(month) && isChallengeRun(d.run)).map((d) => d.run!.seconds)
  const ws = weekStartOf(today)
  const thisWeekDays = sorted.filter((d) => d.date >= ws && d.date <= today)
  const challengeDay = today >= config.challenge.start ? daysBetween(config.challenge.start, today) + 1 : undefined
  const bench = bestTopSet('bench', sorted.filter((d) => d.lifts?.some((s) => s.lift === 'bench')).slice(-1), sorted, config)
  return {
    latestWeight: latest ? { date: latest.date, weight: latest.weight_lb! } : undefined,
    deltaFromStart: latest ? latest.weight_lb! - config.start_weight_lb : undefined,
    avg7Weight: mean(defined(last7.map((d) => d.weight_lb))),
    avg7Cals: mean(defined(last7.map((d) => d.cals))),
    avg7Carbs: mean(defined(last7.map((d) => d.carbs_g))),
    challengeDay,
    challengeLength: daysBetween(config.challenge.start, config.challenge.end) + 1,
    streak: challengeStreak(days, config, today),
    best5kSeconds: monthRuns.length ? Math.min(...defined(monthRuns)) : undefined,
    benchE1rm: bench?.e1rm,
    thisWeek: {
      miles: sum(defined(thisWeekDays.map((d) => d.run?.miles))),
      runDays: thisWeekDays.filter((d) => d.run).length,
      liftDays: thisWeekDays.filter((d) => (d.lifts?.length ?? 0) > 0).length,
      estBurn: totalRunCalories(thisWeekDays, sorted, config),
    },
  }
}

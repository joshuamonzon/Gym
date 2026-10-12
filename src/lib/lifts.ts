/** Lift-screen helpers: per-lift series (pull-ups split weighted / volume) and the loaded session. */
import type { Day, LiftSet, PlanLift } from './schema'
import { sortByDate } from './rollups'
import { liftLabel, num, shortDate } from './format'

export type PullupMode = 'weighted' | 'volume'

/** A row on the Lifts screen. Pull-ups appear twice: weighted (added load) and volume (bodyweight reps). */
export interface LiftKey {
  lift: string
  mode?: PullupMode
}

/** `pullup_weighted` / `pullup_volume` / `bench` — the key used in config.next. */
export function liftKeyId(k: LiftKey): string {
  return k.mode ? `${k.lift}_${k.mode}` : k.lift
}

export function liftKeyLabel(k: LiftKey): string {
  if (k.lift === 'pullup') return k.mode === 'volume' ? 'Pull-ups · volume' : 'Pull-ups · weighted'
  return liftLabel(k.lift)
}

/** Tracked lifts expanded into screen rows. */
export function liftRows(trackedLifts: string[]): LiftKey[] {
  return trackedLifts.flatMap((lift) => (lift === 'pullup' ? [{ lift, mode: 'weighted' as const }, { lift, mode: 'volume' as const }] : [{ lift }]))
}

function matches(k: LiftKey, s: LiftSet): boolean {
  if (s.lift !== k.lift) return false
  if (k.lift !== 'pullup' || !k.mode) return true
  return k.mode === 'weighted' ? s.weight > 0 : s.weight === 0
}

/** Rank sets: heavier first, then more reps. Volume pull-ups are all weight 0 so reps decide. */
function better(a: LiftSet, b: LiftSet): boolean {
  return a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps)
}

export interface SeriesPoint {
  date: string
  weight: number
  reps: number
}

/** Top set per day for a lift row, oldest first. */
export function liftSeries(k: LiftKey, days: Day[]): SeriesPoint[] {
  const out: SeriesPoint[] = []
  for (const d of sortByDate(days)) {
    let top: LiftSet | undefined
    for (const s of d.lifts ?? []) if (matches(k, s) && (!top || better(s, top))) top = s
    if (top) out.push({ date: d.date, weight: top.weight, reps: top.reps })
  }
  return out
}

/** The number the sparkline follows: weight, or reps for volume pull-ups. */
export function sparkValue(k: LiftKey, p: SeriesPoint): number {
  return k.mode === 'volume' ? p.reps : p.weight
}

/** "230 × 5", "+55 × 5", "10 reps" */
export function lastSetParts(k: LiftKey, p: SeriesPoint): { big: string; small: string } {
  if (k.mode === 'volume') return { big: String(p.reps), small: 'reps' }
  if (k.lift === 'pullup') return { big: `+${num(p.weight)}`, small: `× ${p.reps}` }
  return { big: num(p.weight), small: `× ${p.reps}` }
}

/** Map a plan exercise name to a tracked lift row, e.g. "Weighted pull-ups" → pullup/weighted. */
export function liftKeyForExercise(name: string): LiftKey | undefined {
  const n = name.toLowerCase()
  if (n.includes('bench')) return { lift: 'bench' }
  if (n.includes('pull-up') || n.includes('pullup') || n.includes('pull up') || n.includes('chin')) {
    return { lift: 'pullup', mode: n.includes('weighted') ? 'weighted' : 'volume' }
  }
  if (n.includes('leg press')) return { lift: 'leg_press' }
  if (n.includes('deadlift')) return { lift: 'deadlift' }
  if (n.includes('squat')) return { lift: 'squat' }
  if (n.includes('row')) return { lift: 'row' }
  return undefined
}

/** "230 × 5 · Oct 11" for the exercise header, or undefined when never logged. */
export function lastForExercise(name: string, days: Day[]): string | undefined {
  const k = liftKeyForExercise(name)
  if (!k) return undefined
  const series = liftSeries(k, days)
  const p = series[series.length - 1]
  if (!p) return undefined
  const { big, small } = lastSetParts(k, p)
  return `${big} ${small} · ${shortDate(p.date)}`
}

/**
 * The session to show on the Lifts screen: the nearest day on/after today
 * with a `plan.lift`, else the latest day that has one.
 */
export function loadedSession(days: Day[], today: string): { date: string; lift: PlanLift } | undefined {
  const sorted = sortByDate(days)
  const withLift = sorted.filter((d) => d.plan?.lift)
  const upcoming = withLift.find((d) => d.date >= today)
  const pick = upcoming ?? withLift[withLift.length - 1]
  return pick ? { date: pick.date, lift: pick.plan!.lift! } : undefined
}

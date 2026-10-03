/** Display formatting. Returns '—' for missing values so layouts never jump. */

export const DASH = '—'

export function num(v: number | undefined, digits = 0): string {
  if (v === undefined || Number.isNaN(v)) return DASH
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function signed(v: number | undefined, digits = 1): string {
  if (v === undefined || Number.isNaN(v)) return DASH
  const s = num(Math.abs(v), digits)
  if (Math.abs(v) < 0.5 * Math.pow(10, -digits)) return `±${s}`
  return v > 0 ? `+${s}` : `−${s}`
}

/** seconds → m:ss */
export function mmss(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return DASH
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** seconds per mile → m:ss */
export function pace(secPerMile: number | undefined): string {
  return mmss(secPerMile)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 2026-10-01 → Oct 1 */
export function shortDate(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

/** 2026-10-01 → Thu Oct 1 */
export function dowDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return `${DOW[d.getUTCDay()]} ${shortDate(date)}`
}

/** Sep 28 – Oct 4 */
export function weekLabel(start: string, end: string): string {
  return `${shortDate(start)} – ${shortDate(end)}`
}

export const LIFT_LABEL: Record<string, string> = {
  bench: 'Bench',
  pullup: 'Pull-up',
  row: 'Row',
  leg_press: 'Leg press',
  squat: 'Squat',
  deadlift: 'Deadlift',
}

export function liftLabel(lift: string): string {
  return LIFT_LABEL[lift] ?? lift
}

/** 225×5, or +50×5 for pull-ups (added load) */
export function topSet(lift: string, weight: number | undefined, reps: number | undefined): string {
  if (weight === undefined || reps === undefined) return DASH
  const w = lift === 'pullup' ? `+${num(weight)}` : num(weight)
  return `${w}×${reps}`
}

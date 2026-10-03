/** Date helpers on YYYY-MM-DD strings. All math is done in UTC to avoid DST drift. */

const DAY_MS = 86_400_000

export function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

export function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(date: string, n: number): string {
  return fromUtc(new Date(toUtc(date).getTime() + n * DAY_MS))
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / DAY_MS)
}

/** Monday of the ISO week containing `date`. */
export function weekStartOf(date: string): string {
  const d = toUtc(date)
  const dow = d.getUTCDay() // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1
  return addDays(date, -back)
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayLocal(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

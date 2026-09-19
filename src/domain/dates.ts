const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date 'YYYY-MM-DD' for a timestamp. */
export function toLocalDate(ts: number | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local midnight Date for 'YYYY-MM-DD'. */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(localDate: string, n: number): string {
  const d = parseLocalDate(localDate)
  d.setDate(d.getDate() + n)
  return toLocalDate(d)
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(localDate: string): number {
  return parseLocalDate(localDate).getDay()
}

/** Calendar days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  const ms = parseLocalDate(b).getTime() - parseLocalDate(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Local date of the first day of the week containing localDate. */
export function startOfWeek(localDate: string, weekStartsOn: 0 | 1): string {
  const wd = weekday(localDate)
  const diff = (wd - weekStartsOn + 7) % 7
  return addDays(localDate, -diff)
}

export function startOfMonth(localDate: string): string {
  return localDate.slice(0, 8) + '01'
}

export function daysInMonth(localDate: string): number {
  const [y, m] = localDate.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function addMonths(localDate: string, n: number): string {
  const [y, m] = localDate.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return toLocalDate(d)
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function formatLocalDate(localDate: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const d = parseLocalDate(localDate)
  const parts: string[] = []
  if (opts.weekday) parts.push(WEEKDAY_LONG[d.getDay()] + ',')
  parts.push(MONTH_LONG[d.getMonth()].slice(0, 3), String(d.getDate()))
  if (opts.year) parts.push(String(d.getFullYear()))
  return parts.join(' ').replace(', ', ', ')
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
}

/** "2min 30s" style used for rest timers. */
export function formatRest(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}min 0s` : `${m}min ${s}s`
}

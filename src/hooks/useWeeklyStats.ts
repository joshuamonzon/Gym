import { useMemo } from 'react'
import type { Workout } from '@/db/types'
import { addDays, parseLocalDate, startOfWeek, toLocalDate } from '@/domain/dates'

export type StatMetric = 'duration' | 'volume' | 'reps'

export interface WeekBucket {
  weekStart: string
  label: string
  durationSec: number
  volumeLb: number
  reps: number
  workouts: number
}

/** One bucket per week for the last N weeks, oldest first. */
export function useWeeklyStats(workouts: Workout[] | undefined, weeks: number, weekStartsOn: 0 | 1, today: string): WeekBucket[] {
  return useMemo(() => {
    const thisWeek = startOfWeek(today, weekStartsOn)
    const buckets: WeekBucket[] = []
    const index = new Map<string, WeekBucket>()
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const weekStart = addDays(thisWeek, -7 * i)
      const d = parseLocalDate(weekStart)
      const b: WeekBucket = { weekStart, label: `${d.toLocaleString(undefined, { month: 'short' })} ${d.getDate()}`, durationSec: 0, volumeLb: 0, reps: 0, workouts: 0 }
      buckets.push(b)
      index.set(weekStart, b)
    }
    for (const w of workouts ?? []) {
      if (!w.finishedAt) continue
      const b = index.get(startOfWeek(toLocalDate(w.startedAt), weekStartsOn))
      if (!b) continue
      b.durationSec += w.durationSec
      b.volumeLb += w.volumeLb
      b.reps += w.totalReps
      b.workouts += 1
    }
    return buckets
  }, [workouts, weeks, weekStartsOn, today])
}

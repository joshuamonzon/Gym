import { addDays, daysBetween, startOfWeek } from './dates'

/**
 * Hevy-style week streak: consecutive weeks with at least one workout, counted
 * back from the current week, or from last week when this week is still empty.
 */
export function weekStreak(workoutDates: string[], today: string, weekStartsOn: 0 | 1): number {
  if (workoutDates.length === 0) return 0
  const weeks = new Set(workoutDates.map((d) => startOfWeek(d, weekStartsOn)))
  let w = startOfWeek(today, weekStartsOn)
  if (!weeks.has(w)) w = addDays(w, -7)
  let streak = 0
  while (weeks.has(w)) {
    streak += 1
    w = addDays(w, -7)
  }
  return streak
}

/** Calendar days since the most recent workout (0 when trained today). */
export function restDays(workoutDates: string[], today: string): number {
  if (workoutDates.length === 0) return 0
  const last = workoutDates.reduce((a, b) => (a > b ? a : b))
  return Math.max(0, daysBetween(last, today))
}

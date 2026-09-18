import { describe, expect, it } from 'vitest'
import { restDays, weekStreak } from '../streaks'
import { addDays, daysBetween, startOfWeek, toLocalDate, weekday } from '../dates'

describe('dates', () => {
  it('week starts and arithmetic', () => {
    expect(weekday('2026-09-14')).toBe(1)
    expect(startOfWeek('2026-09-17', 1)).toBe('2026-09-14')
    expect(startOfWeek('2026-09-17', 0)).toBe('2026-09-13')
    expect(startOfWeek('2026-09-13', 1)).toBe('2026-09-07')
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(daysBetween('2026-09-14', '2026-09-17')).toBe(3)
    expect(toLocalDate(new Date(2026, 8, 18, 23, 59))).toBe('2026-09-18')
  })
})

describe('weekStreak', () => {
  it('counts consecutive weeks and tolerates an empty current week', () => {
    const dates = ['2026-08-31', '2026-09-02', '2026-09-07', '2026-09-11']
    expect(weekStreak(dates, '2026-09-14', 1)).toBe(2) // Mon of new empty week
    expect(weekStreak(dates, '2026-09-16', 1)).toBe(2)
    expect(weekStreak([...dates, '2026-09-16'], '2026-09-16', 1)).toBe(3)
  })
  it('breaks after a skipped week', () => {
    expect(weekStreak(['2026-08-31', '2026-09-14'], '2026-09-16', 1)).toBe(1)
    expect(weekStreak(['2026-08-24'], '2026-09-16', 1)).toBe(0)
    expect(weekStreak([], '2026-09-16', 1)).toBe(0)
  })
})

describe('restDays', () => {
  it('days since the last workout', () => {
    expect(restDays(['2026-09-14', '2026-09-11'], '2026-09-16')).toBe(2)
    expect(restDays(['2026-09-16'], '2026-09-16')).toBe(0)
    expect(restDays([], '2026-09-16')).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { bodyweightChange, waistToHeightPct } from '../measures'

const today = '2026-09-19'

describe('bodyweightChange', () => {
  it('returns null without any bodyweight', () => {
    expect(bodyweightChange([], today)).toBeNull()
    expect(bodyweightChange([{ date: '2026-09-10', waistIn: 31 }], today)).toBeNull()
  })
  it('a single entry has no delta', () => {
    expect(bodyweightChange([{ date: '2026-09-18', weightLb: 175 }], today)).toEqual({ latestLb: 175, latestDate: '2026-09-18', deltaLb: null, baselineDate: null })
  })
  it('compares with the most recent entry at least 30 days old', () => {
    const rows = [
      { date: '2026-07-01', weightLb: 180 },
      { date: '2026-08-15', weightLb: 178 },
      { date: '2026-09-01', weightLb: 176.5 },
      { date: '2026-09-18', weightLb: 175 },
    ]
    expect(bodyweightChange(rows, today)).toEqual({ latestLb: 175, latestDate: '2026-09-18', deltaLb: -3, baselineDate: '2026-08-15' })
  })
  it('falls back to the oldest earlier entry when the log is younger than the window', () => {
    const rows = [
      { date: '2026-09-10', weightLb: 174 },
      { date: '2026-09-18', weightLb: 175.4 },
    ]
    expect(bodyweightChange(rows, today)).toEqual({ latestLb: 175.4, latestDate: '2026-09-18', deltaLb: 1.4, baselineDate: '2026-09-10' })
  })
})

describe('waistToHeightPct', () => {
  it('rounds to one decimal and guards missing values', () => {
    expect(waistToHeightPct(31, 70)).toBe(44.3)
    expect(waistToHeightPct(null, 70)).toBeNull()
    expect(waistToHeightPct(31, 0)).toBeNull()
  })
})

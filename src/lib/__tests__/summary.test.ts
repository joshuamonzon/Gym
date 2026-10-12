import { describe, expect, it } from 'vitest'
import { bodyLine, fuelLine, liftsLine, runLine, swimLine } from '../summary'

describe('summary lines', () => {
  it('swim: meters, pace per 100 m, HR', () => {
    expect(swimLine({ date: '2026-10-12', swim: { meters: 1000, seconds: 1640, avg_hr: 133 } })).toBe('1,000 m swim, 2:44/100m · 133 bpm')
    expect(swimLine({ date: '2026-10-11', swim: { meters: 914, seconds: 1545 } })).toBe('914 m swim, 2:49/100m')
    expect(swimLine({ date: '2026-10-10' })).toBeUndefined()
  })
  it('run, lifts, fuel, body', () => {
    expect(runLine({ date: '2026-10-12', run: { miles: 3.5, seconds: 2486 } })).toBe('3.50 mi in 41:26')
    expect(liftsLine({ date: '2026-10-11', lifts: [{ lift: 'bench', weight: 230, reps: 5 }, { lift: 'pullup', weight: 55, reps: 5 }] })).toBe('Bench 230×5 · Pull-up +55×5')
    expect(fuelLine({ date: '2026-10-11', cals: 2350, protein_g: 170 })).toBe('2,350 cal · 170 g protein')
    expect(bodyLine({ date: '2026-10-11', sleep_h: 5.47, shift: true })).toBe('5.5 h sleep · 24-hr shift')
  })
})

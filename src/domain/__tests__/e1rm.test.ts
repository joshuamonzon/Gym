import { describe, expect, it } from 'vitest'
import { epley, estimate1rm } from '../e1rm'

describe('e1rm', () => {
  it('epley', () => {
    expect(epley(200, 1)).toBe(200)
    expect(epley(200, 6)).toBeCloseTo(240)
  })
  it('external load', () => {
    expect(estimate1rm(200, 6, 'external', null)).toBeCloseTo(240)
  })
  it('weighted bodyweight subtracts bodyweight again', () => {
    // 175 BW + 50 added × 5 reps → epley(225,5)=262.5 → minus BW = 87.5 added
    expect(estimate1rm(50, 5, 'bodyweight_plus', 175)).toBeCloseTo(87.5)
    expect(estimate1rm(50, 5, 'bodyweight_plus', null)).toBeCloseTo(epley(50, 5))
  })
  it('untracked loads return null', () => {
    expect(estimate1rm(null, 10, 'bodyweight', 175)).toBeNull()
    expect(estimate1rm(null, null, 'external', null)).toBeNull()
    expect(estimate1rm(0, 30, 'time', null)).toBeNull()
  })
})

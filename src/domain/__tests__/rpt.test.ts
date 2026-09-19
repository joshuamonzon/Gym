import { describe, expect, it } from 'vitest'
import { computeTargets } from '../rpt'
import { rptSets, straightSets, restPauseSets } from '@/db/seed/routines'
import { roundToStep } from '../rounding'

describe('roundToStep', () => {
  it('rounds to plate steps and leaves step 0 alone', () => {
    expect(roundToStep(182.25, 5)).toBe(180)
    expect(roundToStep(183, 2.5)).toBe(182.5)
    expect(roundToStep(161.99, 5)).toBe(160)
    expect(roundToStep(101.3, 0)).toBe(101.3)
  })
})

describe('computeTargets (RPT)', () => {
  it('drops 10% per set with barbell rounding', () => {
    expect(computeTargets(rptSets(), 200, 5)).toEqual([200, 180, 160])
  })
  it('keeps the money set unrounded and rounds the drops', () => {
    expect(computeTargets(rptSets(), 202.5, 5)).toEqual([202.5, 180, 160])
  })
  it('uses 2.5 lb steps for dumbbells', () => {
    expect(computeTargets(rptSets(), 55, 2.5)).toEqual([55, 50, 45])
  })
  it('returns nulls without a working weight', () => {
    expect(computeTargets(rptSets(), null, 5)).toEqual([null, null, null])
  })
  it('keeps straight sets at the same weight', () => {
    expect(computeTargets(straightSets(3, 8, 15), 20, 2.5)).toEqual([20, 20, 20])
  })
  it('keeps rest-pause mini-sets at the activation weight', () => {
    expect(computeTargets(restPauseSets(3), 30, 2.5)).toEqual([30, 30, 30, 30])
  })
})

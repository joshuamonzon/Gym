import type { WeightUnit } from '@/db/types'

export const LB_PER_KG = 2.2046226218

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}
export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}

/** Convert a stored pound value to the display unit, trimmed to a sensible precision. */
export function toDisplay(lb: number, unit: WeightUnit): number {
  const v = unit === 'kg' ? lbToKg(lb) : lb
  return Math.round(v * 10) / 10
}

/** Convert a value typed in the display unit back to pounds for storage. */
export function fromDisplay(value: number, unit: WeightUnit): number {
  const lb = unit === 'kg' ? kgToLb(value) : value
  return Math.round(lb * 100) / 100
}

export function formatWeight(lb: number | null | undefined, unit: WeightUnit, withUnit = true): string {
  if (lb === null || lb === undefined || Number.isNaN(lb)) return '—'
  const v = toDisplay(lb, unit)
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1)
  return withUnit ? `${s}${unit === 'kg' ? 'kg' : 'lbs'}` : s
}

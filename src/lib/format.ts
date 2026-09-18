import type { SetKind, WeightUnit, WorkoutSet } from '@/db/types'
import { formatWeight, toDisplay } from '@/domain/units'

export function formatVolume(lb: number, unit: WeightUnit): string {
  const v = Math.round(toDisplay(lb, unit))
  return `${v.toLocaleString()} ${unit === 'kg' ? 'kg' : 'lbs'}`
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function pluralize(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`
}

export function repRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return ''
  if (min === null) return String(max)
  if (max === null || min === max) return String(min)
  return `${min}–${max}`
}

/** Badge text for a set: W, 1, 2, A, M1, +1. */
export function setLabel(kind: SetKind, index: number): string {
  switch (kind) {
    case 'warmup':
      return 'W'
    case 'activation':
      return 'A'
    case 'mini':
      return `M${index}`
    case 'extra':
      return `+${index}`
    default:
      return String(index)
  }
}

/** "200lbs × 6", "+45lbs × 8", "12 reps" or "30s hold" depending on how the exercise is loaded. */
export function formatSetText(s: WorkoutSet, loadType: string | undefined, unit: WeightUnit): string {
  if (loadType === 'time') return s.durationSec !== null ? `${s.durationSec}s hold` : '—'
  if (loadType === 'bodyweight') return s.reps !== null ? `${s.reps} reps` : '—'
  const plus = loadType === 'bodyweight_plus' ? '+' : ''
  return `${plus}${formatWeight(s.weightLb, unit)} × ${s.reps ?? '—'}`
}

export function schemeLabel(scheme: string, sets: number): string {
  switch (scheme) {
    case 'rpt':
      return `RPT × ${sets}`
    case 'rest_pause':
      return 'Rest-pause'
    case 'timed':
      return `${sets} holds`
    default:
      return `${sets} sets`
  }
}

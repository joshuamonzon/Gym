import type { Measurement } from '@/db/types'
import { addDays } from './dates'

export const WAIST_TO_HEIGHT_BAND: [number, number] = [44, 45]

export function waistToHeightPct(waistIn: number | null | undefined, heightIn: number | null | undefined): number | null {
  if (!waistIn || !heightIn || heightIn <= 0) return null
  return Math.round((waistIn / heightIn) * 1000) / 10
}

export function waistTargetIn(heightIn: number | null | undefined): [number, number] | null {
  if (!heightIn || heightIn <= 0) return null
  return [Math.round(heightIn * 0.44 * 10) / 10, Math.round(heightIn * 0.45 * 10) / 10]
}

export interface BodyweightSummary {
  latestLb: number
  latestDate: string
  /** Change versus the baseline entry, null when there is nothing to compare with. */
  deltaLb: number | null
  baselineDate: string | null
}

/**
 * Latest bodyweight and how it moved: compared with the most recent entry at
 * least `days` old, or with the oldest earlier entry when the log is younger.
 */
export function bodyweightChange(rows: Measurement[], today: string, days = 30): BodyweightSummary | null {
  const withWeight = rows.filter((r) => typeof r.weightLb === 'number').sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  if (withWeight.length === 0) return null
  const latest = withWeight[withWeight.length - 1]
  const cutoff = addDays(today, -days)
  const earlier = withWeight.filter((r) => r.date < latest.date)
  const baseline = [...earlier].reverse().find((r) => r.date <= cutoff) ?? earlier[0]
  return {
    latestLb: latest.weightLb!,
    latestDate: latest.date,
    deltaLb: baseline ? Math.round((latest.weightLb! - baseline.weightLb!) * 10) / 10 : null,
    baselineDate: baseline?.date ?? null,
  }
}

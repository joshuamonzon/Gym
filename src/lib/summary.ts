/** One-line, human-readable summaries of a day. Missing fields are simply left out. */
import type { Day } from './schema'
import { aerobicEfficiency, paceSecPerMile } from './rollups'
import { liftLabel, mmss, num, pace, topSet } from './format'

/** "3.18 mi · 12:35 /mi · 128 bpm" */
export function runLine(day: Day, withEff = false): string | undefined {
  const r = day.run
  if (!r) return undefined
  const parts: string[] = []
  if (r.miles !== undefined) parts.push(`${num(r.miles, 2)} mi`)
  if (r.seconds !== undefined) parts.push(mmss(r.seconds))
  const p = paceSecPerMile(r)
  if (p !== undefined) parts.push(`${pace(p)} /mi`)
  if (r.avg_hr !== undefined) parts.push(`${r.avg_hr} bpm`)
  if (withEff) {
    const e = aerobicEfficiency(r)
    if (e !== undefined) parts.push(`eff ${num(e, 2)}`)
  }
  if (r.surface) parts.push(r.surface)
  return parts.join(' · ')
}

/** "Bench 225×5 · Pull-up +50×5" */
export function liftsLine(day: Day): string | undefined {
  if (!day.lifts?.length) return undefined
  return day.lifts.map((s) => `${liftLabel(s.lift)} ${topSet(s.lift, s.weight, s.reps)}`).join(' · ')
}

/** "2,100 cal · 180 g protein · 210 g carbs" */
export function fuelLine(day: Day): string | undefined {
  const parts: string[] = []
  if (day.cals !== undefined) parts.push(`${num(day.cals)} cal`)
  if (day.protein_g !== undefined) parts.push(`${num(day.protein_g)} g protein`)
  if (day.carbs_g !== undefined) parts.push(`${num(day.carbs_g)} g carbs`)
  return parts.length ? parts.join(' · ') : undefined
}

/** "167.4 lb · 7.3 h sleep · shift" */
export function bodyLine(day: Day): string | undefined {
  const parts: string[] = []
  if (day.weight_lb !== undefined) parts.push(`${num(day.weight_lb, 1)} lb`)
  if (day.sleep_h !== undefined) parts.push(`${num(day.sleep_h, 1)} h sleep`)
  if (day.bike_min !== undefined) parts.push(`${num(day.bike_min)} min bike`)
  if (day.shift) parts.push('24-hr shift')
  return parts.length ? parts.join(' · ') : undefined
}

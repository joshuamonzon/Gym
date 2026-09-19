export const WAIST_TO_HEIGHT_BAND: [number, number] = [44, 45]

export function waistToHeightPct(waistIn: number | null | undefined, heightIn: number | null | undefined): number | null {
  if (!waistIn || !heightIn || heightIn <= 0) return null
  return Math.round((waistIn / heightIn) * 1000) / 10
}

export function waistTargetIn(heightIn: number | null | undefined): [number, number] | null {
  if (!heightIn || heightIn <= 0) return null
  return [Math.round(heightIn * 0.44 * 10) / 10, Math.round(heightIn * 0.45 * 10) / 10]
}

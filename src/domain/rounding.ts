/** Round to the nearest multiple of step; step 0 leaves the value unchanged. */
export function roundToStep(value: number, step: number): number {
  if (!step || step <= 0) return value
  const r = Math.round(value / step) * step
  return Math.round(r * 1000) / 1000
}

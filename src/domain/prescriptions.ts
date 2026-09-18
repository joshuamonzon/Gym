import type { Scheme, SetPrescription } from '@/db/types'

export interface PrescriptionConfig {
  sets: number
  repMin: number
  repMax: number
  durationSec: number
  minis: number
  dropPct: number
}

export const DEFAULT_CONFIG: Record<Scheme, PrescriptionConfig> = {
  rpt: { sets: 3, repMin: 4, repMax: 6, durationSec: 0, minis: 0, dropPct: 10 },
  straight: { sets: 3, repMin: 8, repMax: 15, durationSec: 0, minis: 0, dropPct: 0 },
  rest_pause: { sets: 1, repMin: 12, repMax: 15, durationSec: 0, minis: 3, dropPct: 0 },
  timed: { sets: 3, repMin: 0, repMax: 0, durationSec: 30, minis: 0, dropPct: 0 },
  free: { sets: 3, repMin: 8, repMax: 12, durationSec: 0, minis: 0, dropPct: 0 },
}

/** Build set prescriptions from a compact configuration. */
export function generatePrescriptions(scheme: Scheme, c: PrescriptionConfig): SetPrescription[] {
  switch (scheme) {
    case 'rpt':
      return Array.from({ length: Math.max(1, c.sets) }, (_, i) => ({
        kind: 'working',
        repMin: c.repMin + 2 * i,
        repMax: c.repMax + 2 * i,
        ...(i > 0 ? { pctOfPrev: 1 - c.dropPct / 100 } : {}),
      }))
    case 'rest_pause':
      return [
        { kind: 'activation', repMin: c.repMin, repMax: c.repMax },
        ...Array.from({ length: Math.max(0, c.minis) }, (): SetPrescription => ({ kind: 'mini', repMin: 3, repMax: 5, restSec: 20 })),
      ]
    case 'timed':
      return Array.from({ length: Math.max(1, c.sets) }, () => ({ kind: 'working', durationSec: c.durationSec }))
    default:
      return Array.from({ length: Math.max(1, c.sets) }, () => ({ kind: 'working', repMin: c.repMin, repMax: c.repMax }))
  }
}

/** Recover a configuration from existing prescriptions (for the routine editor). */
export function deriveConfig(scheme: Scheme, sets: SetPrescription[]): PrescriptionConfig {
  const d = { ...DEFAULT_CONFIG[scheme] }
  if (sets.length === 0) return d
  if (scheme === 'rest_pause') {
    const a = sets.find((s) => s.kind === 'activation') ?? sets[0]
    return { ...d, repMin: a.repMin ?? d.repMin, repMax: a.repMax ?? d.repMax, minis: sets.filter((s) => s.kind === 'mini').length }
  }
  if (scheme === 'timed') return { ...d, sets: sets.length, durationSec: sets[0].durationSec ?? d.durationSec }
  const first = sets[0]
  const drop = sets.find((s) => s.pctOfPrev !== undefined)?.pctOfPrev
  return { ...d, sets: sets.length, repMin: first.repMin ?? d.repMin, repMax: first.repMax ?? d.repMax, dropPct: drop === undefined ? d.dropPct : Math.round((1 - drop) * 100) }
}

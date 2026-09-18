import { useState } from 'react'
import type { WeightUnit } from '@/db/types'
import type { FinishSummary } from '@/db/repo/activeWorkout'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { NumberField } from '@/components/ui/Inputs'
import { formatDuration } from '@/domain/dates'
import { formatWeight, fromDisplay, toDisplay } from '@/domain/units'
import { formatVolume } from '@/lib/format'

export function FinishSummarySheet({ open, summary, unit, onClose, onSave, saving }: { open: boolean; summary: FinishSummary | null; unit: WeightUnit; onClose: () => void; onSave: (overrides: Record<string, number | null>) => void; saving: boolean }) {
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [forSummary, setForSummary] = useState(summary)
  if (summary !== forSummary) {
    setForSummary(summary)
    setOverrides({})
  }
  const w = summary?.workout
  return (
    <Sheet open={open} onClose={onClose} title="Finish workout">
      {!summary || !w ? (
        <p className="text-muted">Working it out…</p>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Time" value={formatDuration(w.durationSec)} />
            <Stat label="Volume" value={formatVolume(w.volumeLb, unit)} />
            <Stat label="Sets" value={String(summary.setCount)} />
          </div>
          {summary.setCount === 0 && <p className="mb-4 rounded-xl bg-warn/15 p-3 text-sm text-warn">No completed sets. Finishing will save an empty workout; discard instead if you did nothing.</p>}
          {summary.prs.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Records 🏆</h3>
              {summary.prs.map((pr, i) => (
                <div key={i} className="flex justify-between py-1 text-[15px]">
                  <span>{pr.exerciseName}</span>
                  <span className="text-muted">
                    {formatWeight(pr.weightLb, unit)} × {pr.reps} · {pr.kinds.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}
          {summary.suggestions.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Next time</h3>
              {summary.suggestions.map((s) => {
                const next = overrides[s.exerciseId] === undefined ? s.nextLb : overrides[s.exerciseId]
                return (
                  <div key={s.exerciseId} className="flex items-center gap-2 py-1">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px]">{s.name}</div>
                      <div className="text-xs text-muted">
                        {s.hit ? `Hit the top of the range → +${formatWeight(s.incrementLb, unit)}` : s.belowRange ? 'Below the rep range — hold or drop the weight' : 'Inside the range — same weight'}
                      </div>
                    </div>
                    <div className="w-24">
                      <NumberField value={next === null ? null : toDisplay(next, unit)} onCommit={(v) => setOverrides((o) => ({ ...o, [s.exerciseId]: v === null ? null : fromDisplay(v, unit) }))} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Button full size="lg" disabled={saving} onClick={() => onSave(overrides)}>
            {saving ? 'Saving…' : 'Save workout'}
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

import { Button } from '@/components/ui/Button'
import { formatClock } from '@/domain/dates'
import type { RestTimerView } from '@/hooks/useRestTimer'

export function RestTimerBar({ view, onAdjust, onSkip }: { view: RestTimerView; onAdjust: (delta: number) => void; onSkip: () => void }) {
  if (!view.active) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur">
      <div className="h-1 w-full bg-surface-2">
        <div className={`h-1 transition-[width] duration-200 ${view.finished ? 'bg-success' : 'bg-accent'}`} style={{ width: `${view.progress * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2">
        <Button variant="secondary" size="sm" onClick={() => onAdjust(-30)} disabled={view.finished}>
          −30s
        </Button>
        <div className="text-center">
          <div className={`text-3xl font-bold tabular-nums ${view.finished ? 'text-success' : ''}`}>{view.finished ? 'Go!' : formatClock(view.remainingSec)}</div>
          {!view.finished && <div className="text-xs text-muted">Rest · {formatClock(view.durationSec)}</div>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onAdjust(30)} disabled={view.finished}>
            +30s
          </Button>
          <Button variant="primary" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}

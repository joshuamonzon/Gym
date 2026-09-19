import type { Exercise, WeightUnit, WorkoutSet } from '@/db/types'
import { NumberField } from '@/components/ui/Inputs'
import { Check } from '@/components/ui/Icons'
import { fromDisplay, toDisplay } from '@/domain/units'
import { repRange } from '@/lib/format'
import type { SetFill } from '@/domain/workoutEdit'
import { SetBadge } from './SetBadge'

export interface SetRowProps {
  set: WorkoutSet
  index: number
  exercise: Exercise | undefined
  unit: WeightUnit
  previous: WorkoutSet | undefined
  /** Live target for the weight column (see domain/targets). */
  targetWeightLb: number | null
  onUpdate: (patch: Partial<WorkoutSet>) => void
  onComplete: (fill: SetFill) => void
  onUncomplete: () => void
  onBadge: () => void
  resting?: boolean
}

function previousText(prev: WorkoutSet | undefined, loadType: Exercise['loadType'] | undefined, unit: WeightUnit): string {
  if (!prev) return '—'
  if (loadType === 'time') return prev.durationSec !== null ? `${prev.durationSec}s` : '—'
  if (loadType === 'bodyweight') return prev.reps !== null ? `${prev.reps} reps` : '—'
  if (prev.weightLb === null || prev.reps === null) return '—'
  const w = toDisplay(prev.weightLb, unit)
  const plus = loadType === 'bodyweight_plus' ? '+' : ''
  return `${plus}${w}${unit === 'kg' ? 'kg' : 'lbs'} × ${prev.reps}`
}

export function SetRow({ set, index, exercise, unit, previous, targetWeightLb, onUpdate, onComplete, onUncomplete, onBadge, resting }: SetRowProps) {
  const loadType = exercise?.loadType ?? 'external'
  const showWeight = loadType === 'external' || loadType === 'bodyweight_plus'
  const timed = loadType === 'time'

  const targetWeight = targetWeightLb
  const targetReps = set.targetRepMax !== null || set.targetRepMin !== null ? repRange(set.targetRepMin, set.targetRepMax) : previous?.reps !== null && previous?.reps !== undefined ? String(previous.reps) : ''
  const targetDuration = set.targetDurationSec ?? previous?.durationSec ?? null

  const fill = (): SetFill => ({
    weightLb: showWeight ? set.weightLb ?? targetWeight : null,
    reps: timed ? null : set.reps ?? previous?.reps ?? set.targetRepMin ?? null,
    durationSec: timed ? set.durationSec ?? targetDuration : null,
  })

  const rowBg = set.completed ? 'bg-success/15' : resting ? 'bg-accent/10' : ''

  return (
    <div className={`grid grid-cols-[44px_1.3fr_1fr_1fr_44px] items-center gap-2 rounded-xl px-1 py-1 ${rowBg}`}>
      <SetBadge kind={set.kind} index={index} onClick={onBadge} />
      <div className="truncate text-center text-[14px] text-muted">{previousText(previous, loadType, unit)}</div>
      {showWeight ? (
        <NumberField
          aria-label="Weight"
          value={set.weightLb === null ? null : toDisplay(set.weightLb, unit)}
          onCommit={(v) => onUpdate({ weightLb: v === null ? null : fromDisplay(v, unit) })}
          placeholder={targetWeight === null ? '' : String(toDisplay(targetWeight, unit))}
        />
      ) : (
        <div className="text-center text-muted">{loadType === 'bodyweight' ? 'BW' : ''}</div>
      )}
      {timed ? (
        <NumberField
          aria-label="Seconds"
          value={set.durationSec}
          decimals={0}
          onCommit={(v) => onUpdate({ durationSec: v === null ? null : Math.round(v) })}
          placeholder={targetDuration === null ? '' : String(targetDuration)}
        />
      ) : (
        <NumberField
          aria-label="Reps"
          value={set.reps}
          decimals={0}
          onCommit={(v) => onUpdate({ reps: v === null ? null : Math.round(v) })}
          placeholder={targetReps}
        />
      )}
      <button
        type="button"
        aria-label={set.completed ? 'Mark incomplete' : 'Complete set'}
        onClick={() => (set.completed ? onUncomplete() : onComplete(fill()))}
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${set.completed ? 'bg-success text-black' : 'bg-surface-2 text-muted'}`}
      >
        <Check size={22} />
      </button>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router'
import type { Exercise, SetKind, WeightUnit, WorkoutExercise, WorkoutSet } from '@/db/types'
import { More, Plus, Timer } from '@/components/ui/Icons'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { formatRest } from '@/domain/dates'
import type { SetFill } from '@/domain/workoutEdit'
import { effectiveTargets } from '@/domain/targets'
import { SetRow } from './SetRow'

export interface ExerciseBlockProps {
  we: WorkoutExercise
  exercise: Exercise | undefined
  unit: WeightUnit
  previous: WorkoutExercise | undefined
  restingSetId: string | null
  onUpdateSet: (setId: string, patch: Partial<WorkoutSet>) => void
  onCompleteSet: (setId: string, fill: SetFill) => void
  onUncompleteSet: (setId: string) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onSetKind: (setId: string, kind: SetKind) => void
  onNotes: (notes: string) => void
  onMenu: () => void
  onRest: () => void
}

/** Match each set with the same-kind set at the same position in the previous session. */
function matchPrevious(sets: WorkoutSet[], previous: WorkoutExercise | undefined): (WorkoutSet | undefined)[] {
  if (!previous) return sets.map(() => undefined)
  const prevWarm = previous.sets.filter((s) => s.completed && s.kind === 'warmup')
  const prevWork = previous.sets.filter((s) => s.completed && s.kind !== 'warmup')
  let wi = 0
  let ki = 0
  return sets.map((s) => (s.kind === 'warmup' ? prevWarm[wi++] : prevWork[ki++]))
}

export function ExerciseBlock(p: ExerciseBlockProps) {
  const { we, exercise, unit } = p
  const [badgeSet, setBadgeSet] = useState<WorkoutSet | null>(null)
  const [showCoaching, setShowCoaching] = useState(true)
  const prevSets = matchPrevious(we.sets, p.previous)
  const firstWorkingIdx = we.sets.findIndex((s) => s.kind !== 'warmup')
  const fallbackFirst = firstWorkingIdx >= 0 ? prevSets[firstWorkingIdx]?.weightLb ?? null : null
  const targets = effectiveTargets(we, exercise, fallbackFirst)
  const loadType = exercise?.loadType ?? 'external'
  const weightHeader = loadType === 'bodyweight_plus' ? `+${unit === 'kg' ? 'KG' : 'LBS'}` : loadType === 'external' ? (unit === 'kg' ? 'KG' : 'LBS') : ''
  const repsHeader = loadType === 'time' ? 'SEC' : 'REPS'

  // Number working-type sets independently of warm-ups, mini-sets and extras.
  const counters: Record<string, number> = {}
  const indexFor = (s: WorkoutSet) => {
    const key = s.kind === 'mini' ? 'mini' : s.kind === 'extra' ? 'extra' : s.kind === 'warmup' ? 'warmup' : 'working'
    counters[key] = (counters[key] ?? 0) + 1
    return counters[key]
  }

  return (
    <section className="mb-6">
      <div className="mb-1 flex items-start justify-between gap-2 px-1">
        <Link to={`/exercises/${we.exerciseId}`} className="text-[19px] font-semibold leading-tight text-accent">
          {we.nameSnapshot}
        </Link>
        <button type="button" aria-label="Exercise options" onClick={p.onMenu} className="-mr-1 rounded-full p-1 text-white active:bg-surface-2">
          <More />
        </button>
      </div>
      {we.coachingNotes && (
        <button type="button" onClick={() => setShowCoaching((v) => !v)} className="mb-2 block w-full whitespace-pre-line px-1 text-left text-[15px] leading-snug text-white/85">
          {showCoaching ? we.coachingNotes : `${we.coachingNotes.split('\n')[0].slice(0, 60)}…`}
        </button>
      )}
      <NotesField value={we.notes ?? ''} onCommit={p.onNotes} />
      <button type="button" onClick={p.onRest} className="mb-2 flex items-center gap-2 px-1 text-[15px] font-medium text-accent">
        <Timer size={18} />
        Rest Timer: {formatRest(we.restSec)}
      </button>
      <div className="grid grid-cols-[44px_1.3fr_1fr_1fr_44px] gap-2 px-1 pb-1 text-center text-[12px] font-semibold uppercase tracking-wide text-muted">
        <div>Set</div>
        <div>Previous</div>
        <div>{weightHeader}</div>
        <div>{repsHeader}</div>
        <div>✓</div>
      </div>
      <div className="flex flex-col gap-1">
        {we.sets.map((s, i) => (
          <SetRow
            key={s.id}
            set={s}
            index={indexFor(s)}
            exercise={exercise}
            unit={unit}
            previous={prevSets[i]}
            targetWeightLb={targets[i]}
            resting={p.restingSetId === s.id}
            onUpdate={(patch) => p.onUpdateSet(s.id, patch)}
            onComplete={(fill) => p.onCompleteSet(s.id, fill)}
            onUncomplete={() => p.onUncompleteSet(s.id)}
            onBadge={() => setBadgeSet(s)}
          />
        ))}
      </div>
      <Button variant="secondary" full className="mt-2" onClick={p.onAddSet}>
        <Plus size={18} /> Add Set
      </Button>

      <Sheet open={badgeSet !== null} onClose={() => setBadgeSet(null)} title="Set type">
        {badgeSet && (
          <div className="flex flex-col gap-2">
            {(['warmup', 'working', 'activation', 'mini', 'extra'] as SetKind[]).map((k) => (
              <Button
                key={k}
                variant={badgeSet.kind === k ? 'primary' : 'secondary'}
                full
                onClick={() => {
                  p.onSetKind(badgeSet.id, k)
                  setBadgeSet(null)
                }}
              >
                {k === 'warmup' ? 'Warm-up' : k === 'working' ? 'Working set' : k === 'activation' ? 'Activation (rest-pause)' : k === 'mini' ? 'Mini-set (rest-pause)' : 'Extra set'}
              </Button>
            ))}
            <Button
              variant="danger"
              full
              onClick={() => {
                p.onRemoveSet(badgeSet.id)
                setBadgeSet(null)
              }}
            >
              Delete set
            </Button>
          </div>
        )}
      </Sheet>
    </section>
  )
}

/** Locally controlled so a live-query re-render never moves the caret; commits on blur. */
function NotesField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)
  const [synced, setSynced] = useState(value)
  if (!focused && value !== synced) {
    setSynced(value)
    setText(value)
  }
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        if (text !== value) onCommit(text)
      }}
      placeholder="Add notes here…"
      rows={1}
      className="mb-2 w-full resize-none bg-transparent px-1 text-[15px] text-white outline-none placeholder:text-muted"
    />
  )
}

import { useState } from 'react'
import type { Exercise, Routine, Scheme, WeightUnit, Workout, WorkoutExercise } from '@/db/types'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Plus } from '@/components/ui/Icons'
import { Segmented } from '@/components/ui/Segmented'
import * as edit from '@/domain/workoutEdit'
import type { SetFill } from '@/domain/workoutEdit'
import { ExerciseBlock } from './ExerciseBlock'
import { ExercisePicker } from './ExercisePicker'
import { RestTimerSheet } from './RestTimerSheet'

export interface WorkoutEditorProps {
  workout: Workout
  exercises: Exercise[]
  exercisesById: Record<string, Exercise>
  unit: WeightUnit
  previous: Record<string, WorkoutExercise | undefined>
  mutate: (fn: (w: Workout) => Workout) => void
  onCompleteSet: (weId: string, setId: string, fill: SetFill) => void
  onUncompleteSet: (weId: string, setId: string) => void
  buildBlock: (exerciseId: string, scheme?: Scheme) => Promise<WorkoutExercise>
  blocks?: Routine[]
  onAppendBlock?: (routineId: string) => void
  restingSetId?: string | null
  routineAlternatives?: Record<string, string[]>
}

const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'rpt', label: 'RPT' },
  { value: 'straight', label: 'Straight' },
  { value: 'rest_pause', label: 'Rest‑pause' },
  { value: 'timed', label: 'Timed' },
]

export function WorkoutEditor(p: WorkoutEditorProps) {
  const { workout, mutate } = p
  const [menuFor, setMenuFor] = useState<WorkoutExercise | null>(null)
  const [restFor, setRestFor] = useState<WorkoutExercise | null>(null)
  const [swapFor, setSwapFor] = useState<WorkoutExercise | null>(null)
  const [adding, setAdding] = useState(false)

  const pick = async (ex: Exercise) => {
    const block = await p.buildBlock(ex.id)
    mutate((w) => edit.addExercise(w, block))
    setAdding(false)
  }
  const swap = async (ex: Exercise) => {
    if (!swapFor) return
    const block = await p.buildBlock(ex.id, swapFor.scheme)
    mutate((w) => edit.replaceExercise(w, swapFor.id, block))
    setSwapFor(null)
  }
  const changeScheme = async (we: WorkoutExercise, scheme: Scheme) => {
    const block = await p.buildBlock(we.exerciseId, scheme)
    mutate((w) => edit.replaceExercise(w, we.id, block))
    setMenuFor(null)
  }

  const suggestedFor = (we: WorkoutExercise | null): Exercise[] => {
    if (!we) return []
    const ids = p.routineAlternatives?.[we.exerciseId] ?? []
    return ids.map((id) => p.exercisesById[id]).filter(Boolean)
  }

  return (
    <div>
      {workout.exercises.map((we) => (
        <ExerciseBlock
          key={we.id}
          we={we}
          exercise={p.exercisesById[we.exerciseId]}
          unit={p.unit}
          previous={p.previous[we.exerciseId]}
          restingSetId={p.restingSetId ?? null}
          onUpdateSet={(setId, patch) => mutate((w) => edit.updateSet(w, we.id, setId, patch))}
          onCompleteSet={(setId, fill) => p.onCompleteSet(we.id, setId, fill)}
          onUncompleteSet={(setId) => p.onUncompleteSet(we.id, setId)}
          onAddSet={() => mutate((w) => edit.addSet(w, we.id))}
          onRemoveSet={(setId) => mutate((w) => edit.removeSet(w, we.id, setId))}
          onSetKind={(setId, kind) => mutate((w) => edit.setSetKind(w, we.id, setId, kind))}
          onNotes={(notes) => mutate((w) => edit.setExerciseNotes(w, we.id, notes))}
          onMenu={() => setMenuFor(we)}
          onRest={() => setRestFor(we)}
        />
      ))}
      {workout.exercises.length === 0 && <p className="mb-6 rounded-2xl bg-surface p-6 text-center text-muted">No exercises yet. Add one below.</p>}
      <Button full size="lg" onClick={() => setAdding(true)}>
        <Plus size={20} /> Add Exercise
      </Button>

      <ExercisePicker open={adding} onClose={() => setAdding(false)} exercises={p.exercises} onPick={pick} blocks={p.blocks} onPickBlock={(r) => { p.onAppendBlock?.(r.id); setAdding(false) }} />
      <ExercisePicker open={swapFor !== null} onClose={() => setSwapFor(null)} exercises={p.exercises} onPick={swap} title="Swap exercise" suggested={suggestedFor(swapFor)} createLink={false} />

      <RestTimerSheet
        open={restFor !== null}
        onClose={() => setRestFor(null)}
        value={restFor?.restSec ?? 0}
        onChange={(sec) => restFor && mutate((w) => edit.setExerciseRest(w, restFor.id, sec))}
        title={restFor ? `Rest · ${restFor.nameSnapshot}` : 'Rest timer'}
      />

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.nameSnapshot}>
        {menuFor && (
          <div className="flex flex-col gap-2">
            <div className="mb-1">
              <p className="mb-2 text-sm text-muted">Set scheme (rebuilds the sets)</p>
              <Segmented options={SCHEMES} value={menuFor.scheme === 'free' ? 'straight' : menuFor.scheme} onChange={(s) => void changeScheme(menuFor, s)} />
            </div>
            <Button variant="secondary" full onClick={() => { setSwapFor(menuFor); setMenuFor(null) }}>Swap exercise</Button>
            <Button variant="secondary" full onClick={() => { setRestFor(menuFor); setMenuFor(null) }}>Rest timer</Button>
            <div className="flex gap-2">
              <Button variant="secondary" full onClick={() => { mutate((w) => edit.moveExercise(w, menuFor.id, -1)); setMenuFor(null) }}>Move up</Button>
              <Button variant="secondary" full onClick={() => { mutate((w) => edit.moveExercise(w, menuFor.id, 1)); setMenuFor(null) }}>Move down</Button>
            </div>
            <Button variant="danger" full onClick={() => { mutate((w) => edit.removeExercise(w, menuFor.id)); setMenuFor(null) }}>Remove exercise</Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

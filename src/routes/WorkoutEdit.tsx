import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Workout } from '@/db/types'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Empty'
import { Field, NumberField, TextInput } from '@/components/ui/Inputs'
import { WorkoutEditor } from '@/components/workout/WorkoutEditor'
import { useExercises, useExercisesById, useWorkout } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { usePreviousBlocks } from '@/hooks/usePrevious'
import { buildExerciseBlock } from '@/db/repo/activeWorkout'
import { saveWorkout } from '@/db/repo/workouts'
import * as edit from '@/domain/workoutEdit'
import { parseLocalDate, toLocalDate } from '@/domain/dates'

export default function WorkoutEdit() {
  const { id } = useParams()
  const stored = useWorkout(id)
  if (!stored) return <Spinner />
  return <Editor key={stored.id} initial={stored} />
}

function Editor({ initial }: { initial: Workout }) {
  const navigate = useNavigate()
  const settings = useSettings()
  const exercises = useExercises(true)
  const exercisesById = useExercisesById()
  const [w, setW] = useState<Workout>(initial)
  const [saving, setSaving] = useState(false)
  const previous = usePreviousBlocks(w.exerciseIds, w.id)

  const mutate = (fn: (x: Workout) => Workout) => setW((prev) => fn(prev))
  const durationMin = Math.round(w.durationSec / 60)
  const setDate = (localDate: string) => {
    const old = new Date(w.startedAt)
    const d = parseLocalDate(localDate)
    d.setHours(old.getHours(), old.getMinutes())
    mutate((x) => ({ ...x, startedAt: d.getTime(), finishedAt: d.getTime() + x.durationSec * 1000, localDate }))
  }
  const setDuration = (min: number | null) => {
    const sec = Math.max(0, Math.round((min ?? 0) * 60))
    mutate((x) => ({ ...x, durationSec: sec, finishedAt: x.startedAt + sec * 1000 }))
  }
  const save = async () => {
    setSaving(true)
    await saveWorkout({ ...w, finishedAt: w.startedAt + w.durationSec * 1000 })
    navigate(`/workouts/${w.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg px-3">
      <TopBar back title="Edit workout" right={<Button size="sm" onClick={() => void save()} disabled={saving}>Save</Button>} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title">
          <TextInput value={w.title} onChange={(e) => mutate((x) => edit.setWorkoutMeta(x, { title: e.target.value }))} />
        </Field>
        <Field label="Date">
          <input type="date" value={toLocalDate(w.startedAt)} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-[16px] text-white outline-none focus:border-accent" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (minutes)">
          <NumberField value={durationMin} decimals={0} onCommit={setDuration} className="text-left" />
        </Field>
        <Field label="Notes">
          <TextInput value={w.notes ?? ''} onChange={(e) => mutate((x) => edit.setWorkoutMeta(x, { notes: e.target.value || undefined }))} />
        </Field>
      </div>
      <WorkoutEditor
        workout={w}
        exercises={exercises ?? []}
        exercisesById={exercisesById}
        unit={settings.unit}
        previous={previous}
        mutate={mutate}
        onCompleteSet={(weId, setId, fill) => mutate((x) => edit.completeSet(x, weId, setId, fill, x.finishedAt ?? Date.now()))}
        onUncompleteSet={(weId, setId) => mutate((x) => edit.uncompleteSet(x, weId, setId))}
        buildBlock={(exId, scheme) => buildExerciseBlock(exId, scheme)}
      />
      <Button full size="lg" className="mt-4" onClick={() => void save()} disabled={saving}>
        Save changes
      </Button>
    </div>
  )
}

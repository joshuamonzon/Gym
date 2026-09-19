import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Equipment, Exercise, LoadType, MuscleGroup, Scheme } from '@/db/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { Spinner } from '@/components/ui/Empty'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { Confirm } from '@/components/ui/Confirm'
import { Field, NumberField, Select, TextInput } from '@/components/ui/Inputs'
import { Toggle } from '@/components/ui/Toggle'
import { archiveExercise, createExercise, deleteExerciseIfUnused, updateExercise, type ExerciseInput } from '@/db/repo/exercises'
import { useUiStore } from '@/store/uiStore'

const MUSCLES: MuscleGroup[] = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'legs', 'hamstrings', 'glutes', 'abs', 'traps', 'neck', 'forearms', 'mobility', 'other']
const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'weighted_bodyweight', 'other']
const LOAD: { value: LoadType; label: string }[] = [
  { value: 'external', label: 'External weight' },
  { value: 'bodyweight_plus', label: 'Bodyweight + added weight' },
  { value: 'bodyweight', label: 'Bodyweight (reps only)' },
  { value: 'time', label: 'Time (seconds)' },
]
const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'rpt', label: 'Reverse pyramid (RPT)' },
  { value: 'straight', label: 'Straight sets' },
  { value: 'rest_pause', label: 'Rest-pause' },
  { value: 'timed', label: 'Timed holds' },
]

const blank: ExerciseInput = { name: '', muscleGroup: 'chest', equipment: 'barbell', loadType: 'external', defaultScheme: 'rpt', defaultRestSec: 180, incrementLb: 5, roundingLb: 5, coachingNotes: '' }

function toInput(ex: Exercise): ExerciseInput {
  return {
    name: ex.name, aliases: ex.aliases, muscleGroup: ex.muscleGroup, equipment: ex.equipment, loadType: ex.loadType, defaultScheme: ex.defaultScheme,
    defaultRestSec: ex.defaultRestSec, incrementLb: ex.incrementLb, roundingLb: ex.roundingLb, isUnilateral: ex.isUnilateral, coachingNotes: ex.coachingNotes ?? '', archived: ex.archived,
  }
}

export default function ExerciseEdit() {
  const { id } = useParams()
  // undefined = loading, null = new exercise
  const existing = useLiveQuery(async () => (id ? (await db.exercises.get(id)) ?? null : null), [id])
  if (existing === undefined) return <Spinner />
  return <Form key={id ?? 'new'} id={id} existing={existing} />
}

function Form({ id, existing }: { id: string | undefined; existing: Exercise | null }) {
  const navigate = useNavigate()
  const showToast = useUiStore((s) => s.showToast)
  const [form, setForm] = useState<ExerciseInput>(() => (existing ? toInput(existing) : blank))
  const [confirm, setConfirm] = useState(false)

  const set = <K extends keyof ExerciseInput>(k: K, v: ExerciseInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const save = async () => {
    if (!form.name.trim()) {
      showToast('Give the exercise a name.')
      return
    }
    const input = { ...form, name: form.name.trim(), coachingNotes: form.coachingNotes?.trim() || undefined }
    if (id) {
      await updateExercise(id, input)
      navigate(`/exercises/${id}`, { replace: true })
    } else {
      const ex = await createExercise(input)
      navigate(`/exercises/${ex.id}`, { replace: true })
    }
  }
  const remove = async () => {
    if (!id) return
    const deleted = await deleteExerciseIfUnused(id)
    showToast(deleted ? 'Exercise deleted.' : 'Exercise is used in history, so it was archived instead.')
    navigate('/exercises', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title={id ? 'Edit exercise' : 'New exercise'} right={<Button size="sm" onClick={() => void save()}>Save</Button>} />
      <Field label="Name">
        <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Incline Dumbbell Press" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Muscle group">
          <Select value={form.muscleGroup} onChange={(e) => set('muscleGroup', e.target.value as MuscleGroup)}>
            {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Equipment">
          <Select value={form.equipment} onChange={(e) => set('equipment', e.target.value as Equipment)}>
            {EQUIPMENT.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="How it is loaded">
        <Select value={form.loadType} onChange={(e) => set('loadType', e.target.value as LoadType)}>
          {LOAD.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </Field>
      <Field label="Default set scheme">
        <Select value={form.defaultScheme} onChange={(e) => set('defaultScheme', e.target.value as Scheme)}>
          {SCHEMES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Rest (sec)">
          <NumberField value={form.defaultRestSec} decimals={0} onCommit={(v) => set('defaultRestSec', Math.max(0, Math.round(v ?? 0)))} />
        </Field>
        <Field label="Increment (lb)" hint="Added when you hit the top of the range">
          <NumberField value={form.incrementLb} onCommit={(v) => set('incrementLb', Math.max(0, v ?? 0))} />
        </Field>
        <Field label="Rounding (lb)" hint="Plate step for RPT drops">
          <NumberField value={form.roundingLb} onCommit={(v) => set('roundingLb', Math.max(0, v ?? 0))} />
        </Field>
      </div>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
        <span>Unilateral (per side)</span>
        <Toggle checked={Boolean(form.isUnilateral)} onChange={(v) => set('isUnilateral', v)} />
      </div>
      <Field label="Coaching notes" hint="Shown under the exercise during a workout">
        <textarea value={form.coachingNotes ?? ''} onChange={(e) => set('coachingNotes', e.target.value)} rows={5} className="w-full rounded-xl border border-border bg-bg p-3 text-[16px] outline-none focus:border-accent" />
      </Field>
      <Button full size="lg" onClick={() => void save()}>Save</Button>
      {id && existing && (
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="secondary" full onClick={async () => { await archiveExercise(id, !existing.archived); navigate(`/exercises/${id}`, { replace: true }) }}>
            {existing.archived ? 'Unarchive' : 'Archive (hide from pickers)'}
          </Button>
          <Button variant="danger" full onClick={() => setConfirm(true)}>Delete exercise</Button>
        </div>
      )}
      <Confirm open={confirm} title="Delete exercise?" message="If it appears in any workout it will be archived instead." confirmLabel="Delete" danger onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />
    </div>
  )
}

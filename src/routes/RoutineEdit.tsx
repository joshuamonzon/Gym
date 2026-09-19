import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Exercise, Routine, RoutineExercise, RoutineKind, Scheme } from '@/db/types'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Confirm } from '@/components/ui/Confirm'
import { Field, NumberField, Select, TextInput } from '@/components/ui/Inputs'
import { Segmented } from '@/components/ui/Segmented'
import { ArrowDown, ArrowUp, Plus, Trash } from '@/components/ui/Icons'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useExercises, useExercisesById } from '@/hooks/useData'
import { Spinner } from '@/components/ui/Empty'
import { createRoutine, deleteRoutine, saveRoutine, type RoutineInput } from '@/db/repo/routines'
import { DEFAULT_CONFIG, deriveConfig, generatePrescriptions, type PrescriptionConfig } from '@/domain/prescriptions'
import { newId } from '@/lib/id'
import { useUiStore } from '@/store/uiStore'

const KINDS: { value: RoutineKind; label: string }[] = [
  { value: 'main', label: 'Workout' },
  { value: 'abs', label: 'Abs' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'finisher', label: 'Finisher' },
]
const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'rpt', label: 'RPT' },
  { value: 'straight', label: 'Straight' },
  { value: 'rest_pause', label: 'Rest‑pause' },
  { value: 'timed', label: 'Timed' },
]

export default function RoutineEdit() {
  const { id } = useParams()
  // undefined = loading, null = new routine
  const existing = useLiveQuery(async () => (id ? (await db.routines.get(id)) ?? null : null), [id])
  if (existing === undefined) return <Spinner />
  return <Form key={id ?? 'new'} id={id} existing={existing} />
}

function Form({ id, existing }: { id: string | undefined; existing: Routine | null }) {
  const navigate = useNavigate()
  const exercises = useExercises()
  const exercisesById = useExercisesById()
  const showToast = useUiStore((s) => s.showToast)
  const [form, setForm] = useState<RoutineInput>(() =>
    existing
      ? { name: existing.name, kind: existing.kind, exercises: existing.exercises, shortLabel: existing.shortLabel ?? '', description: existing.description, programId: existing.programId }
      : { name: '', kind: 'main', exercises: [], shortLabel: '' },
  )
  const [picking, setPicking] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const updateExercise = (reId: string, fn: (re: RoutineExercise) => RoutineExercise) => setForm((f) => ({ ...f, exercises: f.exercises.map((e) => (e.id === reId ? fn(e) : e)) }))
  const move = (reId: string, delta: -1 | 1) =>
    setForm((f) => {
      const i = f.exercises.findIndex((e) => e.id === reId)
      const j = i + delta
      if (i < 0 || j < 0 || j >= f.exercises.length) return f
      const list = [...f.exercises]
      const [item] = list.splice(i, 1)
      list.splice(j, 0, item)
      return { ...f, exercises: list }
    })
  const add = (ex: Exercise) => {
    const scheme = ex.defaultScheme === 'free' ? 'straight' : ex.defaultScheme
    const re: RoutineExercise = { id: newId(), exerciseId: ex.id, scheme, sets: generatePrescriptions(scheme, DEFAULT_CONFIG[scheme]), restSec: scheme === 'rest_pause' ? 20 : ex.defaultRestSec }
    setForm((f) => ({ ...f, exercises: [...f.exercises, re] }))
    setPicking(false)
  }
  const save = async () => {
    if (!form.name.trim()) {
      showToast('Give the routine a name.')
      return
    }
    if (form.exercises.length === 0) {
      showToast('Add at least one exercise.')
      return
    }
    const input = { ...form, name: form.name.trim(), shortLabel: form.shortLabel?.trim() || undefined }
    if (id && existing) await saveRoutine({ ...existing, ...input })
    else await createRoutine(input)
    navigate('/workout', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title={id ? 'Edit routine' : 'New routine'} right={<Button size="sm" onClick={() => void save()}>Save</Button>} />
      <div className="grid grid-cols-[1fr_88px] gap-3">
        <Field label="Name">
          <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Workout C" />
        </Field>
        <Field label="Badge">
          <TextInput value={form.shortLabel ?? ''} onChange={(e) => setForm((f) => ({ ...f, shortLabel: e.target.value }))} placeholder="C" maxLength={4} />
        </Field>
      </div>
      <Field label="Type">
        <Segmented options={KINDS} value={form.kind} onChange={(kind) => setForm((f) => ({ ...f, kind }))} />
      </Field>

      {form.exercises.map((re, i) => {
        const ex = exercisesById[re.exerciseId]
        const cfg = deriveConfig(re.scheme, re.sets)
        const setCfg = (patch: Partial<PrescriptionConfig>) => updateExercise(re.id, (r) => ({ ...r, sets: generatePrescriptions(r.scheme, { ...cfg, ...patch }) }))
        return (
          <Card key={re.id} className="mb-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{i + 1}. {ex?.name ?? '…'}</div>
                <div className="text-xs text-muted">{summary(re)}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconBtn label="Move up" onClick={() => move(re.id, -1)}><ArrowUp size={18} /></IconBtn>
                <IconBtn label="Move down" onClick={() => move(re.id, 1)}><ArrowDown size={18} /></IconBtn>
                <IconBtn label="Remove" onClick={() => setForm((f) => ({ ...f, exercises: f.exercises.filter((e) => e.id !== re.id) }))}><Trash size={18} /></IconBtn>
              </div>
            </div>
            <Segmented className="mb-3" options={SCHEMES} value={re.scheme === 'free' ? 'straight' : re.scheme} onChange={(scheme) => updateExercise(re.id, (r) => ({ ...r, scheme, sets: generatePrescriptions(scheme, DEFAULT_CONFIG[scheme]), restSec: scheme === 'rest_pause' ? 20 : ex?.defaultRestSec ?? r.restSec }))} />
            <div className="grid grid-cols-3 gap-2">
              {re.scheme === 'timed' ? (
                <>
                  <Mini label="Holds"><NumberField value={cfg.sets} decimals={0} onCommit={(v) => setCfg({ sets: Math.max(1, Math.round(v ?? 1)) })} /></Mini>
                  <Mini label="Seconds"><NumberField value={cfg.durationSec} decimals={0} onCommit={(v) => setCfg({ durationSec: Math.max(1, Math.round(v ?? 20)) })} /></Mini>
                </>
              ) : re.scheme === 'rest_pause' ? (
                <>
                  <Mini label="Activation reps"><NumberField value={cfg.repMax} decimals={0} onCommit={(v) => setCfg({ repMin: Math.max(1, Math.round((v ?? 15) - 3)), repMax: Math.max(1, Math.round(v ?? 15)) })} /></Mini>
                  <Mini label="Mini-sets"><NumberField value={cfg.minis} decimals={0} onCommit={(v) => setCfg({ minis: Math.max(0, Math.round(v ?? 3)) })} /></Mini>
                </>
              ) : (
                <>
                  <Mini label="Sets"><NumberField value={cfg.sets} decimals={0} onCommit={(v) => setCfg({ sets: Math.max(1, Math.round(v ?? 3)) })} /></Mini>
                  <Mini label="Reps min"><NumberField value={cfg.repMin} decimals={0} onCommit={(v) => setCfg({ repMin: Math.max(1, Math.round(v ?? 4)) })} /></Mini>
                  <Mini label="Reps max"><NumberField value={cfg.repMax} decimals={0} onCommit={(v) => setCfg({ repMax: Math.max(1, Math.round(v ?? 6)) })} /></Mini>
                </>
              )}
              {re.scheme === 'rpt' && <Mini label="Drop %"><NumberField value={cfg.dropPct} decimals={0} onCommit={(v) => setCfg({ dropPct: Math.min(50, Math.max(0, Math.round(v ?? 10))) })} /></Mini>}
              <Mini label="Rest (sec)"><NumberField value={re.restSec} decimals={0} onCommit={(v) => updateExercise(re.id, (r) => ({ ...r, restSec: Math.max(0, Math.round(v ?? 0)) }))} /></Mini>
            </div>
            <Field label="Notes">
              <TextInput value={re.notes ?? ''} onChange={(e) => updateExercise(re.id, (r) => ({ ...r, notes: e.target.value || undefined }))} placeholder="Optional cue for this routine" />
            </Field>
            <Field label="Alternatives (for swaps)">
              <Select value="" onChange={(e) => { const v = e.target.value; if (v) updateExercise(re.id, (r) => ({ ...r, alternatives: Array.from(new Set([...(r.alternatives ?? []), v])) })) }}>
                <option value="">{(re.alternatives ?? []).map((a) => exercisesById[a]?.name).filter(Boolean).join(', ') || 'Add an alternative…'}</option>
                {(exercises ?? []).filter((e) => e.id !== re.exerciseId).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
            {(re.alternatives ?? []).length > 0 && (
              <button type="button" className="-mt-2 text-xs text-muted" onClick={() => updateExercise(re.id, (r) => ({ ...r, alternatives: undefined }))}>Clear alternatives</button>
            )}
          </Card>
        )
      })}

      <Button variant="secondary" full size="lg" onClick={() => setPicking(true)}>
        <Plus size={20} /> Add exercise
      </Button>
      <Button full size="lg" className="mt-3" onClick={() => void save()}>Save routine</Button>
      {id && (
        <Button variant="danger" full className="mt-6" onClick={() => setConfirm(true)}>Delete routine</Button>
      )}
      <ExercisePicker open={picking} onClose={() => setPicking(false)} exercises={exercises ?? []} onPick={add} />
      <Confirm open={confirm} title="Delete routine?" confirmLabel="Delete" danger onCancel={() => setConfirm(false)} onConfirm={async () => { if (id) await deleteRoutine(id); navigate('/workout', { replace: true }) }} />
    </div>
  )
}

function summary(re: RoutineExercise): string {
  const c = deriveConfig(re.scheme, re.sets)
  if (re.scheme === 'rpt') return `RPT ${c.sets} sets · ${c.repMin}–${c.repMax}, then −${c.dropPct}% each set · ${re.restSec}s rest`
  if (re.scheme === 'rest_pause') return `Activation ${c.repMin}–${c.repMax} + ${c.minis} mini-sets · 20s rest`
  if (re.scheme === 'timed') return `${c.sets} × ${c.durationSec}s holds · ${re.restSec}s rest`
  return `${c.sets} × ${c.repMin}–${c.repMax} · ${re.restSec}s rest`
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted active:text-white">
      {children}
    </button>
  )
}

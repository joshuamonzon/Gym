import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import type { ActiveWorkout as ActiveWorkoutRow } from '@/db/types'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Confirm } from '@/components/ui/Confirm'
import { Spinner } from '@/components/ui/Empty'
import { ChevronDown, Timer } from '@/components/ui/Icons'
import { Field, TextInput } from '@/components/ui/Inputs'
import { WorkoutEditor } from '@/components/workout/WorkoutEditor'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { RestTimerSheet } from '@/components/workout/RestTimerSheet'
import { FinishSummarySheet } from '@/components/workout/FinishSummarySheet'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useExercises, useExercisesById, useRoutine, useRoutines } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { useNow } from '@/hooks/useNow'
import { useRestTimer } from '@/hooks/useRestTimer'
import { usePreviousBlocks } from '@/hooks/usePrevious'
import * as edit from '@/domain/workoutEdit'
import { formatClock } from '@/domain/dates'
import { adjustRest, appendRoutineToActive, buildExerciseBlock, completeSetActive, discardWorkout, finishWorkout, mutateDraft, skipRest, startRest, summarizeActive, type FinishSummary } from '@/db/repo/activeWorkout'
import { unlockAudio } from '@/lib/audio'
import { requestPersistentStorage } from '@/lib/storage'
import { useUiStore } from '@/store/uiStore'

export default function ActiveWorkout() {
  const active = useActiveWorkout()
  if (active === null) return <Spinner />
  if (!active) return <Navigate to="/workout" replace />
  return <Screen active={active} />
}

function Screen({ active }: { active: ActiveWorkoutRow }) {
  const settings = useSettings()
  const exercises = useExercises(true)
  const exercisesById = useExercisesById()
  const routines = useRoutines()
  const routine = useRoutine(active.draft.routineId ?? undefined)
  const navigate = useNavigate()
  const showToast = useUiStore((s) => s.showToast)
  const now = useNow(1000)
  const rest = useRestTimer(active.restTimer, settings.timerSound)
  const previous = usePreviousBlocks(active.draft.exerciseIds, active.draft.id)
  const [finishOpen, setFinishOpen] = useState(false)
  const [summary, setSummary] = useState<FinishSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [manualRest, setManualRest] = useState(false)

  const alternatives = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const e of routine?.exercises ?? []) if (e.alternatives?.length) map[e.exerciseId] = e.alternatives
    return map
  }, [routine])

  const draft = active.draft
  const elapsed = formatClock((now - draft.startedAt) / 1000)
  const blocks = (routines ?? []).filter((r) => r.kind !== 'main')

  const openFinish = async () => {
    unlockAudio()
    setSummary(null)
    setFinishOpen(true)
    setSummary(await summarizeActive())
  }
  const save = async (overrides: Record<string, number | null>) => {
    if (saving) return
    setSaving(true)
    try {
      const w = await finishWorkout({ nextWeightOverrides: overrides })
      setFinishOpen(false)
      void requestPersistentStorage()
      navigate(`/workouts/${w.id}?saved=1`, { replace: true })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the workout.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-black/95 px-3 pt-safe pb-2 backdrop-blur">
        <div className="flex h-12 items-center gap-3">
          <button type="button" aria-label="Minimize" onClick={() => navigate('/workout')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <ChevronDown />
          </button>
          <span className="text-[15px] font-semibold text-accent tabular-nums">{elapsed}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Rest timer" onClick={() => setManualRest(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Timer />
          </button>
          <Button size="md" className="rounded-full px-5" onClick={() => void openFinish()}>
            Finish
          </Button>
        </div>
      </header>

      <div className={`px-3 pt-2 ${rest.active ? 'pb-44' : 'pb-24'}`}>
        <WorkoutEditor
          workout={draft}
          exercises={exercises ?? []}
          exercisesById={exercisesById}
          unit={settings.unit}
          previous={previous}
          mutate={(fn) => void mutateDraft(fn)}
          onCompleteSet={(weId, setId, fill) => {
            unlockAudio()
            void completeSetActive(weId, setId, fill)
          }}
          onUncompleteSet={(weId, setId) => void mutateDraft((w) => edit.uncompleteSet(w, weId, setId))}
          buildBlock={(id, scheme) => buildExerciseBlock(id, scheme)}
          blocks={blocks}
          onAppendBlock={(id) => void appendRoutineToActive(id)}
          restingSetId={active.restTimer?.setId ?? null}
          routineAlternatives={alternatives}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <Button variant="danger" onClick={() => setDiscardOpen(true)}>
            Discard Workout
          </Button>
        </div>
      </div>

      <RestTimerBar view={rest} onAdjust={(d) => void adjustRest(d)} onSkip={() => void skipRest()} />

      <RestTimerSheet open={manualRest} onClose={() => setManualRest(false)} value={settings.restDefaults.rpt} onChange={(sec) => { unlockAudio(); if (sec > 0) void startRest(sec) }} title="Start a rest timer" />

      <FinishSummarySheet open={finishOpen} summary={summary} unit={settings.unit} onClose={() => setFinishOpen(false)} onSave={(o) => void save(o)} saving={saving} />

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Workout settings">
        <Field label="Title">
          <TextInput defaultValue={draft.title} onBlur={(e) => void mutateDraft((w) => edit.setWorkoutMeta(w, { title: e.target.value || 'Workout' }))} />
        </Field>
        <Field label="Notes">
          <textarea defaultValue={draft.notes ?? ''} rows={3} onBlur={(e) => void mutateDraft((w) => edit.setWorkoutMeta(w, { notes: e.target.value || undefined }))} className="w-full rounded-xl border border-border bg-bg p-3 text-[16px] outline-none focus:border-accent" />
        </Field>
      </Sheet>

      <Confirm open={discardOpen} title="Discard workout?" message="All sets logged in this workout will be lost." confirmLabel="Discard" danger onCancel={() => setDiscardOpen(false)} onConfirm={async () => { setDiscardOpen(false); await discardWorkout(); navigate('/workout', { replace: true }) }} />
    </div>
  )
}

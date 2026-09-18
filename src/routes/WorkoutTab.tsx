import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Routine } from '@/db/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { Confirm } from '@/components/ui/Confirm'
import { More, Plus } from '@/components/ui/Icons'
import { useActiveProgram, useExercisesById, useRoutines } from '@/hooks/useData'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useTodayPlan } from '@/hooks/useTodayPlan'
import { appendRoutineToActive, startWorkout } from '@/db/repo/activeWorkout'
import { deleteRoutine, duplicateRoutine } from '@/db/repo/routines'
import { unlockAudio } from '@/lib/audio'
import { useUiStore } from '@/store/uiStore'

export default function WorkoutTab() {
  const routines = useRoutines()
  const exercisesById = useExercisesById()
  const active = useActiveWorkout()
  const { program, phase } = useActiveProgram()
  const today = useTodayPlan()
  const navigate = useNavigate()
  const showToast = useUiStore((s) => s.showToast)
  const [menuFor, setMenuFor] = useState<Routine | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Routine | null>(null)

  const start = async (routineId: string | null) => {
    unlockAudio()
    if (active) {
      showToast('A workout is already in progress.')
      navigate('/workout/active')
      return
    }
    await startWorkout(routineId)
    navigate('/workout/active')
  }
  const addBlock = async (routineId: string) => {
    unlockAudio()
    if (active) await appendRoutineToActive(routineId)
    else await startWorkout(routineId)
    navigate('/workout/active')
  }

  const list = routines ?? []
  const phaseIds = phase?.routineIds ?? []
  const phaseRoutines = phaseIds.map((id) => list.find((r) => r.id === id)).filter((r): r is Routine => Boolean(r))
  const otherMain = list.filter((r) => r.kind === 'main' && !phaseIds.includes(r.id)).sort((a, b) => a.name.localeCompare(b.name))
  const blocks = list.filter((r) => r.kind !== 'main')

  const preview = (r: Routine) => r.exercises.map((e) => exercisesById[e.exerciseId]?.name ?? '…').join(', ')

  return (
    <div className="mx-auto max-w-lg px-4 pt-safe">
      <div className="flex items-center justify-between pt-4 pb-3">
        <h1 className="text-3xl font-bold">Workout</h1>
      </div>
      <Button variant="secondary" full size="lg" className="mb-6 justify-start" onClick={() => void start(null)}>
        <Plus size={20} /> Start Empty Workout
      </Button>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Routines</h2>
        <Button size="sm" variant="secondary" onClick={() => navigate('/routines/new')}>
          <Plus size={16} /> New Routine
        </Button>
      </div>

      {program && phase && (
        <button type="button" onClick={() => navigate('/programs')} className="mb-3 flex w-full items-center justify-between rounded-2xl bg-accent/15 px-4 py-3 text-left">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">Active program</span>
            <span className="block font-semibold">{program.name}</span>
            <span className="block text-sm text-muted">{phase.name}{today.plan?.routine ? ` · next: ${today.plan.routine.name}` : ''}</span>
          </span>
          <span className="text-sm font-semibold text-accent">Change</span>
        </button>
      )}

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">My Routines ({phaseRoutines.length + otherMain.length})</h3>
      {[...phaseRoutines, ...otherMain].map((r) => (
        <Card key={r.id} className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">
                {r.name}
                {today.plan?.routineId === r.id && today.plan.kind !== 'done' && <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">Next</span>}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{preview(r)}</p>
            </div>
            <button type="button" aria-label="Routine options" onClick={() => setMenuFor(r)} className="-mr-2 rounded-full p-2 text-muted active:bg-surface-2">
              <More />
            </button>
          </div>
          <Button full className="mt-3" onClick={() => void start(r.id)}>
            Start Routine
          </Button>
        </Card>
      ))}

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Blocks</h3>
      <p className="mb-2 text-sm text-muted">Add to the current workout or run on their own.</p>
      {blocks.map((r) => (
        <Card key={r.id} className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">{r.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{preview(r)}</p>
            </div>
            <button type="button" aria-label="Routine options" onClick={() => setMenuFor(r)} className="-mr-2 rounded-full p-2 text-muted active:bg-surface-2">
              <More />
            </button>
          </div>
          <Button variant="secondary" full className="mt-3" onClick={() => void addBlock(r.id)}>
            {active ? 'Add to workout' : 'Start'}
          </Button>
        </Card>
      ))}

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        {menuFor && (
          <div className="flex flex-col gap-2">
            <Button variant="secondary" full onClick={() => { navigate(`/routines/${menuFor.id}/edit`); setMenuFor(null) }}>Edit routine</Button>
            <Button variant="secondary" full onClick={async () => { const c = await duplicateRoutine(menuFor.id); setMenuFor(null); if (c) navigate(`/routines/${c.id}/edit`) }}>Duplicate</Button>
            <Button variant="danger" full onClick={() => { setConfirmDelete(menuFor); setMenuFor(null) }}>Delete routine</Button>
          </div>
        )}
      </Sheet>
      <Confirm open={confirmDelete !== null} title={`Delete ${confirmDelete?.name}?`} message="Logged workouts keep their history." confirmLabel="Delete" danger onCancel={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) void deleteRoutine(confirmDelete.id); setConfirmDelete(null) }} />
    </div>
  )
}

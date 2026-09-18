import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useNow } from '@/hooks/useNow'
import { formatClock } from '@/domain/dates'
import { discardWorkout } from '@/db/repo/activeWorkout'
import { ChevronUp, Trash } from '@/components/ui/Icons'
import { Confirm } from '@/components/ui/Confirm'

export function MinimizedWorkoutBar() {
  const active = useActiveWorkout()
  const now = useNow(1000, Boolean(active))
  const navigate = useNavigate()
  const location = useLocation()
  const [confirm, setConfirm] = useState(false)
  if (!active || location.pathname.startsWith('/workout/active')) return null
  const current = active.draft.exercises.find((e) => e.sets.some((s) => !s.completed)) ?? active.draft.exercises[0]
  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 px-3">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-full bg-surface-2/95 p-2 pl-3 shadow-xl backdrop-blur">
          <button type="button" aria-label="Resume workout" onClick={() => navigate('/workout/active')} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
            <ChevronUp />
          </button>
          <button type="button" onClick={() => navigate('/workout/active')} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-success" />
              {active.draft.title} {formatClock((now - active.draft.startedAt) / 1000)}
            </div>
            <div className="truncate text-sm text-muted">{current?.nameSnapshot ?? 'No exercises yet'}</div>
          </button>
          <button type="button" aria-label="Discard workout" onClick={() => setConfirm(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-danger">
            <Trash />
          </button>
        </div>
      </div>
      <Confirm open={confirm} title="Discard workout?" message="All sets logged in this workout will be lost." confirmLabel="Discard" danger onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); void discardWorkout() }} />
    </>
  )
}

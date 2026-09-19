import { useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { Confirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/Button'
import { Spinner, Empty } from '@/components/ui/Empty'
import { More } from '@/components/ui/Icons'

import { useSettings } from '@/hooks/useSettings'
import { useExercisesById } from '@/hooks/useData'
import { deleteWorkout } from '@/db/repo/workouts'
import { formatDuration, formatLocalDate } from '@/domain/dates'
import { formatSetText, formatVolume, setLabel } from '@/lib/format'

export default function WorkoutDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const settings = useSettings()
  const exercisesById = useExercisesById()
  const w = useLiveQuery(async () => (id ? (await db.workouts.get(id)) ?? null : null), [id])
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)

  if (w === undefined) return <Spinner />
  if (w === null)
    return (
      <div className="mx-auto max-w-lg px-4">
        <TopBar back="/history" title="Workout" />
        <Empty title="Workout not found" />
      </div>
    )

  const start = new Date(w.startedAt)
  const end = new Date(w.finishedAt ?? w.startedAt)
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar
        back
        title={formatLocalDate(w.localDate, { weekday: true, year: true })}
        right={
          <button type="button" aria-label="Options" onClick={() => setMenu(true)} className="rounded-full p-2 text-white active:bg-surface-2">
            <More />
          </button>
        }
      />
      {params.get('saved') && <div className="mb-3 rounded-2xl bg-success/15 px-4 py-3 font-semibold text-success">Workout saved 🎉</div>}
      <Card className="mb-3">
        <h1 className="text-2xl font-bold">{w.title}</h1>
        <p className="text-sm text-muted">
          {w.routineName && w.routineName !== w.title ? `${w.routineName} · ` : ''}
          {time(start)} – {time(end)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Time" value={formatDuration(w.durationSec)} />
          <Stat label="Volume" value={formatVolume(w.volumeLb, settings.unit)} />
          <Stat label="Records" value={`${w.prCount} 🏆`} />
        </div>
        {w.notes && <p className="mt-3 whitespace-pre-line text-[15px] text-white/85">{w.notes}</p>}
      </Card>

      {w.exercises.map((we) => {
        const ex = exercisesById[we.exerciseId]
        const counters: Record<string, number> = {}
        return (
          <Card key={we.id} className="mb-3">
            <Link to={`/exercises/${we.exerciseId}`} className="text-lg font-semibold text-accent">
              {we.nameSnapshot}
            </Link>
            {we.notes && <p className="mt-1 text-sm text-muted">{we.notes}</p>}
            <div className="mt-2 divide-y divide-border">
              {we.sets.map((s) => {
                const key = s.kind === 'mini' ? 'mini' : s.kind === 'extra' ? 'extra' : s.kind === 'warmup' ? 'warmup' : 'working'
                counters[key] = (counters[key] ?? 0) + 1
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 text-[15px]">
                    <span className={`w-8 text-center font-bold ${s.kind === 'warmup' ? 'text-warn' : 'text-muted'}`}>{setLabel(s.kind, counters[key])}</span>
                    <span className="flex-1">{formatSetText(s, ex?.loadType, settings.unit)}</span>
                    {s.prs?.length ? <span className="text-sm">🏆 {s.prs.join(', ')}</span> : null}
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
      {w.exercises.length === 0 && <Empty title="No exercises logged">Use Edit to add sets.</Empty>}

      <Sheet open={menu} onClose={() => setMenu(false)} title="Workout">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" full onClick={() => navigate(`/workouts/${w.id}/edit`)}>Edit workout</Button>
          <Button variant="danger" full onClick={() => { setMenu(false); setConfirm(true) }}>Delete workout</Button>
        </div>
      </Sheet>
      <Confirm open={confirm} title="Delete this workout?" message="This cannot be undone." confirmLabel="Delete" danger onCancel={() => setConfirm(false)} onConfirm={async () => { await deleteWorkout(w.id); navigate('/history', { replace: true }) }} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

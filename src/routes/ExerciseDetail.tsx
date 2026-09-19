import { lazy, Suspense, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumberField } from '@/components/ui/Inputs'
import { Spinner, Empty } from '@/components/ui/Empty'
import { formatSetText, setLabel } from '@/lib/format'
import { useExercise, useLatestBodyweight, useWorkoutsForExercise } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { setNextWorkingWeight } from '@/db/repo/progress'
import { bestsForExercise } from '@/domain/prs'
import { estimate1rm } from '@/domain/e1rm'
import { topSetWeightLb } from '@/domain/workoutMath'
import { formatLocalDate, parseLocalDate } from '@/domain/dates'
import { formatWeight, fromDisplay, toDisplay } from '@/domain/units'

const ExerciseLineChart = lazy(() => import('@/components/charts/ExerciseLineChart'))

export default function ExerciseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ex = useExercise(id)
  const workouts = useWorkoutsForExercise(id)
  const bw = useLatestBodyweight()
  const settings = useSettings()
  const progress = useLiveQuery(() => (id ? db.exerciseProgress.get(id) : undefined), [id])
  const unit = settings.unit

  const sessions = useMemo(() => {
    if (!ex || !workouts) return []
    return workouts
      .map((w) => {
        const we = w.exercises.find((e) => e.exerciseId === ex.id)
        if (!we) return null
        const sets = we.sets.filter((s) => s.completed)
        let e1rm: number | null = null
        for (const s of sets) {
          if (s.kind === 'warmup') continue
          const v = estimate1rm(s.weightLb, s.reps, ex.loadType, bw)
          if (v !== null && (e1rm === null || v > e1rm)) e1rm = v
        }
        const d = parseLocalDate(w.localDate)
        return { id: w.id, date: w.localDate, label: `${d.toLocaleString(undefined, { month: 'short' })} ${d.getDate()}`, top: topSetWeightLb(we), e1rm, sets, notes: we.notes }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [ex, workouts, bw])

  if (!ex) return <Spinner />
  const bests = bestsForExercise(workouts ?? [], ex, bw)
  const tracksLoad = ex.loadType === 'external' || ex.loadType === 'bodyweight_plus'
  const plus = ex.loadType === 'bodyweight_plus' ? '+' : ''
  const nextLb = progress?.nextWorkingWeightLb ?? progress?.workingWeightLb ?? null

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back title={ex.name} right={<Button size="sm" variant="secondary" onClick={() => navigate(`/exercises/${ex.id}/edit`)}>Edit</Button>} />
      <p className="mb-3 text-sm text-muted">
        {ex.muscleGroup} · {ex.equipment.replace('_', ' ')} · {ex.defaultScheme.replace('_', '-')}
        {ex.archived ? ' · archived' : ''}
      </p>
      {ex.coachingNotes && <Card className="mb-3 whitespace-pre-line text-[15px] text-white/85">{ex.coachingNotes}</Card>}

      {tracksLoad && (
        <Card className="mb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Next working weight</div>
              <div className="text-sm text-muted">Pre-fills the top set. +{formatWeight(ex.incrementLb, unit)} when you hit the top of the range.</div>
            </div>
            <div className="w-24">
              <NumberField value={nextLb === null ? null : toDisplay(nextLb, unit)} onCommit={(v) => void setNextWorkingWeight(ex.id, v === null ? null : fromDisplay(v, unit))} placeholder="—" />
            </div>
          </div>
        </Card>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        <Stat label="Best set" value={bests.bestSet && bests.bestSet.reps !== null ? `${plus}${formatWeight(bests.bestSet.weightLb, unit, false)} × ${bests.bestSet.reps}` : '—'} />
        <Stat label="Est. 1RM" value={bests.maxE1rm !== null ? `${plus}${formatWeight(bests.maxE1rm, unit)}` : '—'} />
        <Stat label="Sessions" value={String(sessions.length)} />
      </div>

      {tracksLoad && sessions.length > 1 && (
        <Card className="mb-3">
          <div className="mb-2 text-sm text-muted">Top set (blue) and estimated 1RM (grey)</div>
          <Suspense fallback={<Spinner />}>
            <ExerciseLineChart data={sessions.map((s) => ({ date: s.date, label: s.label, weight: s.top === null ? null : toDisplay(s.top, unit), e1rm: s.e1rm === null ? null : toDisplay(s.e1rm, unit) }))} unit={unit === 'kg' ? 'kg' : 'lbs'} />
          </Suspense>
        </Card>
      )}

      <h2 className="mb-2 text-lg font-semibold text-muted">History</h2>
      {sessions.length === 0 && <Empty title="Not logged yet" />}
      {[...sessions].reverse().map((s) => {
        const counters: Record<string, number> = {}
        return (
          <Card key={s.id} className="mb-3">
            <Link to={`/workouts/${s.id}`} className="font-semibold text-accent">
              {formatLocalDate(s.date, { weekday: true, year: true })}
            </Link>
            {s.notes && <p className="text-sm text-muted">{s.notes}</p>}
            <div className="mt-1">
              {s.sets.map((set) => {
                const key = set.kind === 'mini' ? 'mini' : set.kind === 'extra' ? 'extra' : set.kind === 'warmup' ? 'warmup' : 'working'
                counters[key] = (counters[key] ?? 0) + 1
                return (
                  <div key={set.id} className="flex gap-3 py-0.5 text-[15px]">
                    <span className={`w-8 text-center font-bold ${set.kind === 'warmup' ? 'text-warn' : 'text-muted'}`}>{setLabel(set.kind, counters[key])}</span>
                    <span>{formatSetText(set, ex.loadType, unit)}</span>
                    {set.prs?.length ? <span>🏆</span> : null}
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="truncate font-semibold">{value}</div>
    </div>
  )
}

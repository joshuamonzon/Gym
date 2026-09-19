import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Empty'
import { WeekStrip } from '@/components/home/WeekStrip'
import { BodyweightCard } from '@/components/home/BodyweightCard'
import { useWorkingWeights } from '@/hooks/useWorkingWeights'
import { useSettings } from '@/hooks/useSettings'
import { formatWeight } from '@/domain/units'
import { useTodayPlan } from '@/hooks/useTodayPlan'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useExercisesById, useRoutines } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { appendRoutineToActive, startWorkout } from '@/db/repo/activeWorkout'
import { updateSettings } from '@/db/repo/settings'
import { RT } from '@/db/seed'
import { formatClock, formatDuration, formatLocalDate, WEEKDAY_LONG, weekday } from '@/domain/dates'
import { unlockAudio } from '@/lib/audio'
import { schemeLabel } from '@/lib/format'
import { ChevronRight } from '@/components/ui/Icons'

export default function Home() {
  const view = useTodayPlan()
  const active = useActiveWorkout()
  const routines = useRoutines()
  const exercisesById = useExercisesById()
  const navigate = useNavigate()
  const now = useNow(1000, Boolean(active))
  const settings = useSettings()
  const [picker, setPicker] = useState(false)
  const planExerciseIds = useMemo(() => view.plan?.routine?.exercises.map((e) => e.exerciseId) ?? [], [view.plan])
  const weights = useWorkingWeights(planExerciseIds)
  const weightText = (exerciseId: string): string | null => {
    const ex = exercisesById[exerciseId]
    if (!ex || (ex.loadType !== 'external' && ex.loadType !== 'bodyweight_plus')) return null
    const w = weights[exerciseId]
    if (w === null || w === undefined) return null
    return `${ex.loadType === 'bodyweight_plus' ? '+' : ''}${formatWeight(w, settings.unit)}`
  }

  const start = async (routineId: string | null) => {
    unlockAudio()
    if (!active) await startWorkout(routineId)
    navigate('/workout/active')
  }
  const addBlock = async (routineId: string) => {
    unlockAudio()
    if (active) await appendRoutineToActive(routineId)
    else await startWorkout(routineId)
    navigate('/workout/active')
  }

  const plan = view.plan
  const mainRoutines = (routines ?? []).filter((r) => r.kind === 'main')
  const heading = `${WEEKDAY_LONG[weekday(view.today)]}, ${formatLocalDate(view.today)}`

  return (
    <div className="mx-auto max-w-lg px-4 pt-safe">
      <div className="flex items-end justify-between pt-4 pb-3">
        <div>
          <p className="text-sm text-muted">{heading}</p>
          <h1 className="text-3xl font-bold">Today</h1>
        </div>
        <Link to="/settings" className="text-sm font-semibold text-accent">
          Settings
        </Link>
      </div>

      {active && (
        <button type="button" onClick={() => navigate('/workout/active')} className="mb-3 flex w-full items-center justify-between rounded-2xl bg-accent/15 px-4 py-3 text-left">
          <span>
            <span className="block font-semibold text-accent">Workout in progress</span>
            <span className="block text-sm text-muted">
              {active.draft.title} · {formatClock((now - active.draft.startedAt) / 1000)}
            </span>
          </span>
          <ChevronRight className="text-accent" />
        </button>
      )}

      {view.loading || !plan ? (
        <Spinner />
      ) : (
        <Card className="mb-3">
          {plan.kind === 'train' && plan.routine && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Training day{plan.overridden ? ' · override' : ''}</p>
              <h2 className="mt-1 text-2xl font-bold">{plan.routine.name}</h2>
              {plan.routine.description && <p className="mt-1 text-sm text-muted">{plan.routine.description}</p>}
              <ul className="mt-3 space-y-1 text-[15px]">
                {plan.routine.exercises.map((e) => {
                  const wt = weightText(e.exerciseId)
                  return (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span className="truncate">{exercisesById[e.exerciseId]?.name ?? '…'}</span>
                      <span className="shrink-0 text-muted">
                        {wt && <span className="font-semibold text-white">{wt}</span>}
                        {wt ? ' · ' : ''}
                        {schemeLabel(e.scheme, e.sets.length)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {plan.warn48h && plan.hoursSinceLast !== null && (
                <p className="mt-3 rounded-xl bg-warn/15 p-2 text-sm text-warn">Only {Math.round(plan.hoursSinceLast)} h since your last session. The program asks for 48 h of recovery.</p>
              )}
              <Button full size="lg" className="mt-4" onClick={() => void start(plan.routineId)}>
                {active ? 'Resume workout' : `Start ${plan.routine.name}`}
              </Button>
            </>
          )}
          {plan.kind === 'rest' && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">Rest day</p>
              <h2 className="mt-1 text-2xl font-bold">Recover</h2>
              {plan.routine && plan.nextDate && (
                <p className="mt-1 text-[15px] text-muted">
                  Next: <span className="text-white">{plan.routine.name}</span> on {WEEKDAY_LONG[weekday(plan.nextDate)]}, {formatLocalDate(plan.nextDate)}
                </p>
              )}
              <Button variant="secondary" full className="mt-4" onClick={() => void start(plan.routineId)}>
                {active ? 'Resume workout' : plan.routine ? `Start ${plan.routine.name} anyway` : 'Start a workout'}
              </Button>
            </>
          )}
          {plan.kind === 'done' && plan.doneWorkout && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-success">Done for today ✓</p>
              <h2 className="mt-1 text-2xl font-bold">{plan.doneWorkout.routineName ?? plan.doneWorkout.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{formatDuration(plan.doneWorkout.durationSec)} · {plan.doneWorkout.prCount} records</p>
              {plan.nextDate && <p className="mt-1 text-sm text-muted">Next training day: {WEEKDAY_LONG[weekday(plan.nextDate)]}</p>}
              <Button variant="secondary" full className="mt-4" onClick={() => navigate(`/workouts/${plan.doneWorkout!.id}`)}>
                View workout
              </Button>
            </>
          )}
          {plan.kind === 'none' && (
            <>
              <h2 className="text-xl font-bold">No program phase selected</h2>
              <Button full className="mt-4" onClick={() => navigate('/programs')}>
                Choose a program
              </Button>
            </>
          )}
          {plan.kind !== 'done' && (
            <button type="button" onClick={() => setPicker(true)} className="mt-3 w-full text-center text-sm font-semibold text-accent">
              Do a different workout
            </button>
          )}
        </Card>
      )}

      <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-muted">This week</h3>
      {view.strip.length > 0 && <WeekStrip days={view.strip} />}

      <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-muted">Also this week</h3>
      <Card className="divide-y divide-border p-0">
        <DueRow label="Abs" sub="Strength over volume · 2–3× per week" done={view.abs.done} target={view.abs.target} onAdd={() => void addBlock(RT.abs)} />
        <DueRow label="Trifecta mobility" sub="Back bridge · L-sit · twist stretch" done={view.mobility.done} target={view.mobility.target} onAdd={() => void addBlock(RT.trifecta)} />
      </Card>

      <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-muted">Bodyweight</h3>
      <BodyweightCard today={view.today} />

      <Sheet open={picker} onClose={() => setPicker(false)} title="Which workout?">
        <div className="flex flex-col gap-2">
          {[...view.phaseRoutines, ...mainRoutines.filter((r) => !view.phaseRoutines.some((p) => p.id === r.id))].map((r) => (
            <Button
              key={r.id}
              variant="secondary"
              full
              onClick={() => {
                setPicker(false)
                void start(r.id)
              }}
            >
              {r.name}
            </Button>
          ))}
          {view.phaseRoutines.length > 1 && (
            <Button
              variant="ghost"
              full
              onClick={() => {
                const alt = view.phaseRoutines.find((r) => r.id !== plan?.routineId)
                if (alt) void updateSettings({ nextOverrideRoutineId: alt.id })
                setPicker(false)
              }}
            >
              Just switch the next planned workout
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  )
}

function DueRow({ label, sub, done, target, onAdd }: { label: string; sub: string; done: number; target: number; onAdd: () => void }) {
  const complete = done >= target
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{label}</div>
        <div className="truncate text-sm text-muted">{sub}</div>
      </div>
      <div className={`text-sm font-semibold ${complete ? 'text-success' : 'text-muted'}`}>
        {done}/{target}
      </div>
      <Button size="sm" variant="secondary" onClick={onAdd}>
        Add
      </Button>
    </div>
  )
}

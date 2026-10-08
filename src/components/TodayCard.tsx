import { useCallback, useEffect, useState } from 'react'
import type { Plan, PlanCardio, PlanExercise, PlanSet } from '../lib/schema'
import { dowDate, mmss, num } from '../lib/format'
import { Card } from './ui'

/**
 * The day's plan, display only. Working sets can be ticked off mid-lift; that
 * state lives in localStorage only and is never written back to the day file.
 */
export function TodayCard({ date, plan }: { date: string; plan: Plan | undefined }) {
  if (!plan || (!plan.cardio && !plan.lift)) {
    return <p className="px-1 text-sm text-muted">No plan logged for today.</p>
  }
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-muted">Today</h2>
        <span className="text-sm text-muted">{dowDate(date)}</span>
      </div>

      {plan.cardio && <CardioLine cardio={plan.cardio} />}

      {plan.lift && (
        <div className={plan.cardio ? 'mt-5' : 'mt-3'}>
          {plan.lift.name && <h3 className="font-semibold">{plan.lift.name}</h3>}
          <div className="mt-3 space-y-5">
            {plan.lift.exercises?.map((ex, i) => (
              <Exercise key={`${i}:${ex.name}`} date={date} exercise={ex} />
            ))}
          </div>
          {plan.lift.notes && plan.lift.notes.length > 0 && (
            <ul className="mt-5 space-y-1 text-sm text-muted">
              {plan.lift.notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

// 24×24 stroke icons per cardio type.
const CARDIO_ICON: Record<PlanCardio['type'], string> = {
  run: 'M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0M8 21l3-6 3 2 3-5M6 12l4-3 3 2 2-3 4 2',
  bike: 'M5 17a3 3 0 1 0 0 .01M19 17a3 3 0 1 0 0 .01M12 17l-2-6 4-3 2 3h3M9 8h3M7 11l3-3',
  walk: 'M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0M10 21l2-7 3 2v5M9 12l3-4 2 1 2 3h2M12 8l-3 4',
  rest: 'M4 14h16v4H4zM6 14V9h4v5M14 14v-3h4v3',
}

function CardioLine({ cardio }: { cardio: PlanCardio }) {
  const parts = [cardio.target, cardio.duration_min !== undefined ? `${num(cardio.duration_min)} min` : undefined].filter(Boolean)
  return (
    <div className="mt-3 flex items-center gap-3">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-accent"
        aria-label={cardio.type}
        role="img"
      >
        <path d={CARDIO_ICON[cardio.type]} />
      </svg>
      <div className="min-w-0">
        <div className="font-semibold">{cardio.label ?? cardio.type}</div>
        {parts.length > 0 && <div className="text-sm text-muted tabular-nums">{parts.join(' · ')}</div>}
      </div>
    </div>
  )
}

function setKey(exercise: string, index: number): string {
  return `${exercise}:${index}`
}

/** Done-state for working sets, persisted per day in localStorage. Any storage failure is ignored. */
function useDoneSets(date: string): [Set<string>, (key: string) => void] {
  const storageKey = `training:plan-done:${date}`
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return new Set(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...done]))
    } catch {
      /* storage unavailable: done-state is a convenience, not data */
    }
  }, [done, storageKey])
  const toggle = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  return [done, toggle]
}

function fmtW(w: PlanSet['w']): string {
  return typeof w === 'number' ? num(w) : w
}
function fmtR(r: PlanSet['r']): string {
  return typeof r === 'number' ? String(r) : r
}

function Exercise({ date, exercise }: { date: string; exercise: PlanExercise }) {
  const [done, toggle] = useDoneSets(date)
  let warm = 0
  let work = 0
  const rows = (exercise.sets ?? []).map((s, i) => {
    const label = s.warmup ? `W${++warm}` : String(++work)
    return { set: s, index: i, label }
  })
  return (
    <div>
      <h4 className="font-medium">{exercise.name}</h4>
      {exercise.note && <p className="mt-0.5 text-sm text-muted">{exercise.note}</p>}
      {rows.length > 0 && (
        <table className="mt-2 w-full text-sm tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th className="text-left font-normal py-1 w-10">Set</th>
              <th className="text-right font-normal py-1 w-[32%]">Weight</th>
              <th className="text-right font-normal py-1">Reps</th>
              <th className="w-8 py-1">
                <span className="sr-only">Done</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ set, index, label }) => {
              const key = setKey(exercise.name, index)
              const isDone = done.has(key)
              if (set.warmup) {
                return (
                  <tr key={index} className="text-muted/70 border-t border-border/40">
                    <td className="py-1.5">{label}</td>
                    <td className="py-1.5 text-right">{fmtW(set.w)}</td>
                    <td className="py-1.5 text-right">
                      {fmtR(set.r)}
                      {set.note && <span className="ml-1 text-xs">({set.note})</span>}
                    </td>
                    <td />
                  </tr>
                )
              }
              return (
                <tr
                  key={index}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isDone}
                  onClick={() => toggle(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle(key)
                    }
                  }}
                  className={`cursor-pointer select-none border-t border-border/60 ${isDone ? 'text-muted' : ''}`}
                >
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-right">{fmtW(set.w)}</td>
                  <td className="py-2 text-right">
                    {fmtR(set.r)}
                    {set.note && <span className="ml-1 text-xs text-muted">({set.note})</span>}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        isDone ? 'border-up bg-up text-bg' : 'border-border'
                      }`}
                    >
                      {isDone && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {exercise.rest_s !== undefined && <p className="mt-1.5 text-xs text-muted">Rest {mmss(exercise.rest_s)}</p>}
    </div>
  )
}

import { useMemo } from 'react'
import { config, days } from '../lib/data'
import type { Day } from '../lib/schema'
import { challengeKind } from '../lib/rollups'
import { addDays, daysBetween } from '../lib/dates'
import { num, shortDate } from '../lib/format'
import { fuelLine, liftsLine, runLine, swimLine } from '../lib/summary'
import { useDone } from '../lib/done'
import { PlanCards } from '../components/PlanCards'

const byDate = new Map(days.map((d) => [d.date, d]))

/** Challenge grid, the day's plan, and one line about yesterday. */
export function Today({ today, onGo }: { today: string; onGo: (tab: 'lifts') => void }) {
  const [done, toggle] = useDone(today)
  const day = byDate.get(today)
  const plan = day?.plan
  const hasPlan = !!plan && (!!plan.cardio || !!plan.lift || (plan.mobility?.length ?? 0) > 0)
  const yesterday = byDate.get(addDays(today, -1))
  const yLine = useMemo(() => (yesterday ? yesterdayLine(yesterday) : undefined), [yesterday])

  return (
    <>
      <ChallengeGrid today={today} />

      {hasPlan ? (
        <>
          <div className="sec">Plan</div>
          <PlanCards plan={plan} days={days} done={done} toggle={toggle} />
          {!plan.lift && (
            <div className="card">
              <div className="title">
                <div>
                  <div className="kind">Lift</div>
                  <h3>None today</h3>
                </div>
              </div>
              <div className="note">
                The next session is loaded on the Lifts tab.{' '}
                <button type="button" className="link" onClick={() => onGo('lifts')}>
                  Open the session
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="note">No plan written for today yet. Ask in the chat and it lands here.</div>
        </div>
      )}

      {yLine && (
        <>
          <div className="sec">
            Yesterday <span className="r">{shortDate(addDays(today, -1))}</span>
          </div>
          <div className="card">
            <div className="note">{yLine}</div>
          </div>
        </>
      )}
    </>
  )
}

/** "ran 3.50 mi in 41:26 · 1,000 m swim, 2:44/100m · Bench 230×5 · 2,350 cal · 170 g protein" */
function yesterdayLine(d: Day): string | undefined {
  const bits: string[] = []
  const run = runLine(d)
  if (run) bits.push(`ran ${run}`)
  const swim = swimLine(d)
  if (swim) bits.push(swim)
  if (d.bike_min !== undefined) bits.push(`Kickr ${num(d.bike_min)} min`)
  const lifts = liftsLine(d)
  if (lifts) bits.push(lifts)
  const fuel = fuelLine(d)
  if (fuel) bits.push(fuel)
  if (bits.length === 0 && d.plan?.cardio?.type === 'rest') bits.push('rest day')
  return bits.length ? bits.join(' · ') : undefined
}

function ChallengeGrid({ today }: { today: string }) {
  const { start, end, name } = config.challenge
  const length = daysBetween(start, end) + 1
  const cells = useMemo(() => {
    let count = 0
    const out = []
    for (let i = 0; i < length; i++) {
      const date = addDays(start, i)
      const kind = challengeKind(byDate.get(date))
      if (kind) count++
      out.push({ date, kind, isToday: date === today })
    }
    return { count, out }
  }, [start, length, today])
  return (
    <section className="oct" aria-label={`${name} challenge`}>
      <div className="hd">
        <h2>{name} challenge</h2>
        <div className="count">
          {cells.count}
          <small>/ {length}</small>
        </div>
      </div>
      <div className="grid" style={{ '--cols': length } as React.CSSProperties}>
        {cells.out.map((c) => (
          <div key={c.date} className={`cell${c.kind ? ` ${c.kind}` : ''}${c.isToday ? ' today' : ''}`} title={shortDate(c.date)} />
        ))}
      </div>
      <div className="legend">
        <span>
          <i className="run" />
          5K done
        </span>
        <span>
          <i className="swim" />
          swim
        </span>
        <span>
          <i className="bike" />
          bike (legacy)
        </span>
        <span>
          <i className="today" />
          today
        </span>
      </div>
    </section>
  )
}

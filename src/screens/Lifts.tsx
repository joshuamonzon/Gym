import { useMemo } from 'react'
import { config, days } from '../lib/data'
import { lastSetParts, liftKeyId, liftKeyLabel, liftRows, liftSeries, loadedSession, sparkValue, type LiftKey } from '../lib/lifts'
import { shortDate } from '../lib/format'
import { useDone } from '../lib/done'
import { LiftCard } from '../components/PlanCards'

/** The loaded session (next plan.lift), then last / next for every tracked lift. */
export function Lifts({ today }: { today: string }) {
  const session = useMemo(() => loadedSession(days, today), [today])
  const rows = useMemo(() => liftRows(config.tracked_lifts), [])
  return (
    <>
      <div className="sec">
        Loaded session
        {session && <span className="r">{session.date === today ? 'today' : session.date > today ? `planned ${shortDate(session.date)}` : `last written ${shortDate(session.date)}`}</span>}
      </div>
      {session ? (
        <LoadedSession date={session.date} />
      ) : (
        <div className="card">
          <div className="note">No session loaded yet. Ask in the chat and it lands here.</div>
        </div>
      )}

      <div className="sec">
        Every lift <span className="r">last · next</span>
      </div>
      {rows.map((k) => (
        <LiftRow key={liftKeyId(k)} k={k} />
      ))}
      <p className="foot">
        Progress every lift from the last one (weight or reps) unless the previous session's reps were missed — then repeat, never regress. Bench moves
        in 5-lb jumps.
      </p>
    </>
  )
}

/** Separate component so the done-state hook is keyed to the session's date (ticks sync with Today when it's the same day). */
function LoadedSession({ date }: { date: string }) {
  const [done, toggle] = useDone(date)
  const lift = days.find((d) => d.date === date)!.plan!.lift!
  return <LiftCard lift={lift} days={days} kind="2 heavy sessions a week · faster, not bigger" hero done={done} toggle={toggle} />
}

function LiftRow({ k }: { k: LiftKey }) {
  const series = useMemo(() => liftSeries(k, days), [k])
  const last = series[series.length - 1]
  const next = config.next?.[liftKeyId(k)]
  const vals = series.map((p) => sparkValue(k, p))
  return (
    <div className="lift">
      <div className="n">
        {liftKeyLabel(k)}
        {last && (
          <span className="faint" style={{ fontWeight: 500 }}>
            {' '}
            · {shortDate(last.date)}
          </span>
        )}
      </div>
      <Spark vals={vals} />
      <div className="last">
        {last ? (
          <>
            {lastSetParts(k, last).big}
            <small>{lastSetParts(k, last).small}</small>
          </>
        ) : (
          <span className="faint">—</span>
        )}
      </div>
      {next && (
        <div className="next">
          <span>next</span>
          <b>{next}</b>
        </div>
      )}
    </div>
  )
}

function Spark({ vals }: { vals: number[] }) {
  if (vals.length < 2) return <span className="nos" />
  const W = 84
  const H = 30
  const p = 4
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const X = (i: number) => p + (i / (vals.length - 1)) * (W - 2 * p)
  const Y = (v: number) => (hi === lo ? H / 2 : p + (1 - (v - lo) / (hi - lo)) * (H - 2 * p))
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={X(vals.length - 1).toFixed(1)} cy={Y(vals[vals.length - 1]).toFixed(1)} r="3" fill="var(--accent)" />
    </svg>
  )
}

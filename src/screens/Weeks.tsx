import { useMemo, useState } from 'react'
import { config, days } from '../lib/data'
import { weeklyRollups, type WeekRollup } from '../lib/rollups'
import { dowDate, liftLabel, num, pace, signed, topSet, weekLabel } from '../lib/format'
import { Card, Empty, ScreenHeader, Stat } from '../components/ui'
import { deltaTone, toneCls } from '../lib/tone'
import { bodyLine, fuelLine, liftsLine, runDetailLine, runLine } from '../lib/summary'
import type { Day } from '../lib/schema'

/** One card per week, newest first. Headline numbers only; tap for the days. */
export function Weeks() {
  const weeks = useMemo(() => weeklyRollups(days, config), [])
  const [open, setOpen] = useState<string | null>(weeks[0]?.start ?? null)
  return (
    <>
      <ScreenHeader title="Weeks" />
      <main className="px-4 space-y-3">
        {weeks.length === 0 && <Empty>No weeks yet.</Empty>}
        {weeks.map((w) => (
          <WeekCard key={w.start} week={w} open={open === w.start} onToggle={() => setOpen(open === w.start ? null : w.start)} />
        ))}
      </main>
    </>
  )
}

// Tailwind needs literal class names.
const GRID = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-2', 'grid-cols-3', 'grid-cols-3'] as const

function WeekCard({ week: w, open, onToggle }: { week: WeekRollup; open: boolean; onToggle: () => void }) {
  // Only show what was actually logged. Four slots max.
  const stats: React.ReactNode[] = []
  if (w.totalMiles > 0) {
    stats.push(<Stat key="mi" label="Miles" value={num(w.totalMiles, 1)} sub={`${w.runDays} run${w.runDays === 1 ? '' : 's'}`} />)
  }
  if (w.avgPace !== undefined) {
    stats.push(<Stat key="pace" label="Pace" value={pace(w.avgPace)} unit="/mi" sub={w.avgRunHr !== undefined ? `${num(w.avgRunHr)} bpm` : undefined} />)
  }
  if (w.estBurn > 0) {
    stats.push(<Stat key="burn" label="Est. burn" value={`~${num(w.estBurn)}`} unit="cal" sub="from runs" />)
  }
  if (w.avgWeight !== undefined) {
    const t = deltaTone(w.deltaWeight, 'down')
    stats.push(
      <Stat
        key="wt"
        label="Weight"
        value={num(w.avgWeight, 1)}
        unit="lb"
        sub={w.deltaWeight !== undefined ? <span className={toneCls(t)}>{signed(w.deltaWeight, 1)} vs last wk</span> : undefined}
      />,
    )
  }
  if (w.avgSleep !== undefined) {
    stats.push(<Stat key="sleep" label="Sleep" value={num(w.avgSleep, 1)} unit="h" />)
  }
  if (w.avgCals !== undefined) {
    stats.push(<Stat key="cals" label="Eaten" value={num(w.avgCals)} unit="cal" sub="daily avg" />)
  }

  const liftParts = config.tracked_lifts
    .map((lift) => {
      const top = w.lifts[lift]
      if (!top) return undefined
      const d = w.liftDelta[lift]
      return (
        <span key={lift} className="whitespace-nowrap">
          {liftLabel(lift)} <span className="text-fg">{topSet(lift, top.weight, top.reps)}</span>
          {d !== undefined && Math.abs(d) >= 0.5 && <span className={toneCls(deltaTone(d, 'up'))}> {signed(d, 0)}</span>}
        </span>
      )
    })
    .filter(Boolean)

  return (
    <Card>
      <button onClick={onToggle} aria-expanded={open} className="w-full text-left p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">{weekLabel(w.start, w.end)}</h2>
          <span className="text-xs text-muted">
            {w.days.length} day{w.days.length === 1 ? '' : 's'}
            {w.shiftDays > 0 && ` · ${w.shiftDays} shift${w.shiftDays === 1 ? '' : 's'}`}
          </span>
        </div>

        {stats.length > 0 && (
          <div className={`mt-4 grid gap-4 ${GRID[Math.min(stats.length, 6)]}`}>{stats}</div>
        )}

        {liftParts.length > 0 && (
          <div className="mt-4 text-sm text-muted flex flex-wrap gap-x-3 gap-y-1">{liftParts}</div>
        )}

        {stats.length === 0 && liftParts.length === 0 && <p className="mt-3 text-sm text-muted">Nothing logged yet.</p>}
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-2">
          {w.days.map((d) => (
            <DayRow key={d.date} day={d} />
          ))}
        </div>
      )}
    </Card>
  )
}

/** One day, as sentences. Blank fields don't appear. */
function DayRow({ day }: { day: Day }) {
  const lines = [runLine(day), runDetailLine(day, days, config), liftsLine(day), bodyLine(day), fuelLine(day)].filter(
    (l): l is string => !!l,
  )
  return (
    <div className="py-3 border-t border-border/60 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{dowDate(day.date)}</span>
        {lines.length === 0 && <span className="text-xs text-muted">rest</span>}
      </div>
      {lines.map((l, i) => (
        <p key={i} className={`text-sm leading-snug mt-1 ${i === 0 ? 'text-fg' : 'text-muted'}`}>
          {l}
        </p>
      ))}
    </div>
  )
}

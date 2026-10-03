import { useMemo, useState } from 'react'
import { config, days } from '../lib/data'
import { aerobicEfficiency, paceSecPerMile, weeklyRollups, type WeekRollup } from '../lib/rollups'
import { DASH, dowDate, liftLabel, num, pace, signed, topSet, weekLabel } from '../lib/format'
import { Card, Empty, ScreenHeader, Stat } from '../components/ui'
import { deltaTone } from '../lib/tone'

/** One card per week, newest first. Tap to expand into its daily rows. */
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

function WeekCard({ week: w, open, onToggle }: { week: WeekRollup; open: boolean; onToggle: () => void }) {
  return (
    <Card>
      <button onClick={onToggle} aria-expanded={open} className="w-full text-left p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">{weekLabel(w.start, w.end)}</h2>
          <span className="text-xs text-muted">
            {w.days.length} day{w.days.length === 1 ? '' : 's'} logged
          </span>
        </div>

        {/* Fields in spec order. */}
        <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3">
          <Stat
            label="Avg weight"
            value={num(w.avgWeight, 1)}
            size="md"
            sub={<span className={toneCls(deltaTone(w.deltaWeight, 'down'))}>Δ {signed(w.deltaWeight, 1)} lb</span>}
          />
          <Stat label="Avg cals" value={num(w.avgCals)} size="md" />
          <Stat label="Protein" value={num(w.avgProtein)} size="md" sub="g" />
          <Stat label="Carbs" value={num(w.avgCarbs)} size="md" sub="g" />
          <Stat label="Miles" value={num(w.totalMiles, 2)} size="md" sub={`${w.runDays} run day${w.runDays === 1 ? '' : 's'}`} />
          <Stat label="Avg pace" value={pace(w.avgPace)} size="md" sub="/mi" />
          <Stat label="Avg run HR" value={num(w.avgRunHr)} size="md" sub="bpm" />
          <Stat label="Efficiency" value={num(w.efficiency, 3)} size="md" sub="m/min ÷ bpm" />
          <div />
          {config.tracked_lifts.map((lift) => {
            const top = w.lifts[lift]
            const delta = w.liftDelta[lift]
            return (
              <Stat
                key={lift}
                label={liftLabel(lift)}
                value={topSet(lift, top?.weight, top?.reps)}
                size="md"
                sub={
                  <>
                    e1RM {num(top?.e1rm)}
                    {delta !== undefined && <span className={toneCls(deltaTone(delta, 'up'))}> {signed(delta, 0)}</span>}
                  </>
                }
              />
            )
          })}
          <Stat label="Shift days" value={String(w.shiftDays)} size="md" />
          <Stat label="Sleep" value={num(w.avgSleep, 1)} size="md" sub="h avg" />
        </div>
      </button>

      {open && <DailyRows week={w} />}
    </Card>
  )
}

function toneCls(t: 'up' | 'down' | undefined): string {
  return t === 'up' ? 'text-up' : t === 'down' ? 'text-down' : ''
}

const COLS = ['Weight', 'Cals', 'Protein', 'Carbs', 'Run', 'Pace', 'HR', 'Eff.', 'Sleep', 'Shift', 'Lifts'] as const

/** Horizontally scrollable table; first column (date) stays put. */
function DailyRows({ week }: { week: WeekRollup }) {
  return (
    <div className="border-t border-border overflow-x-auto">
      <table className="text-sm whitespace-nowrap">
        <thead className="text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th className="sticky left-0 bg-surface text-left font-normal px-4 py-2">Day</th>
            {COLS.map((c) => (
              <th key={c} className="text-right font-normal px-3 py-2 last:text-left last:pr-4">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {week.days.map((d) => (
            <tr key={d.date} className="border-t border-border/60">
              <td className="sticky left-0 bg-surface px-4 py-2 font-medium">{dowDate(d.date)}</td>
              <Cell>{num(d.weight_lb, 1)}</Cell>
              <Cell>{num(d.cals)}</Cell>
              <Cell>{num(d.protein_g)}</Cell>
              <Cell>{num(d.carbs_g)}</Cell>
              <Cell>{d.run?.miles !== undefined ? `${num(d.run.miles, 2)} mi` : DASH}</Cell>
              <Cell>{d.run ? pace(paceSecPerMile(d.run)) : DASH}</Cell>
              <Cell>{num(d.run?.avg_hr)}</Cell>
              <Cell>{d.run ? num(aerobicEfficiency(d.run), 3) : DASH}</Cell>
              <Cell>{num(d.sleep_h, 1)}</Cell>
              <Cell>{d.shift === undefined ? DASH : d.shift ? 'yes' : 'no'}</Cell>
              <td className="px-3 py-2 pr-4 text-left text-muted">
                {d.lifts?.length
                  ? d.lifts.map((s) => `${liftLabel(s.lift)} ${topSet(s.lift, s.weight, s.reps)}`).join(' · ')
                  : DASH}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-right tabular-nums">{children}</td>
}

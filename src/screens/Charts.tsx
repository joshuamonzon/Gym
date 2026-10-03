import { useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import { config, days } from '../lib/data'
import { dailyE1rm, weeklyRollups, weightSeries } from '../lib/rollups'
import { addDays, todayLocal, weekStartOf } from '../lib/dates'
import { liftLabel, num, pace, shortDate, weekLabel } from '../lib/format'
import { Card, Empty, ScreenHeader, Segmented } from '../components/ui'

type Range = '4w' | '8w' | 'all'

/** Palette: validated categorical slots (light / dark). Hue follows the entity, never its rank. */
const DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
const C = DARK
  ? { s1: '#3987e5', s2: '#d95926', s3: '#199e70', s4: '#c98500', grid: '#2a2a31', text: '#8b8b94', tip: '#222228', dot: '#f4f4f5' }
  : { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', s4: '#eda100', grid: '#d9d9de', text: '#6b6b75', tip: '#ffffff', dot: '#111114' }
const LIFT_COLOR: Record<string, string> = { bench: C.s1, pullup: C.s2, row: C.s3, leg_press: C.s4 }

const tooltipStyle = {
  contentStyle: { background: C.tip, border: `1px solid ${C.grid}`, borderRadius: 8, fontSize: 12 },
  labelStyle: { color: C.text },
  itemStyle: { padding: 0 },
}
const axis = { tick: { fontSize: 11, fill: C.text }, axisLine: false, tickLine: false } as const
const margin = { top: 8, right: 8, left: -12, bottom: 0 }

/** First day included for a range, anchored to the current week. */
function rangeStart(range: Range, today: string): string | undefined {
  if (range === 'all') return undefined
  const weeks = range === '4w' ? 4 : 8
  return addDays(weekStartOf(today), -7 * (weeks - 1))
}

/**
 * One metric per chart, one axis per chart. A chart only appears once there is
 * something to draw; the range picker only appears once there is more than a
 * month of data.
 */
export function Charts() {
  const [range, setRange] = useState<Range>('all')
  const today = todayLocal()
  const from = rangeStart(range, today)

  const weeks = useMemo(() => weeklyRollups(days, config).reverse(), []) // oldest → newest
  const weeksIn = useMemo(() => weeks.filter((w) => !from || w.start >= from), [weeks, from])
  const daysIn = useMemo(() => days.filter((d) => !from || d.date >= from), [from])
  const showRange = weeks.length > 4

  const charts = [
    <WeightChart key="w" daysIn={daysIn} />,
    <MilesChart key="m" weeks={weeksIn} />,
    <PaceChart key="p" weeks={weeksIn} />,
    <LiftsChart key="l" daysIn={daysIn} />,
    <CaloriesChart key="c" weeks={weeksIn} />,
  ]

  return (
    <>
      <ScreenHeader
        title="Charts"
        right={
          showRange ? (
            <Segmented
              ariaLabel="Range"
              value={range}
              onChange={setRange}
              options={[
                { value: '4w', label: '4w' },
                { value: '8w', label: '8w' },
                { value: 'all', label: 'All' },
              ]}
            />
          ) : undefined
        }
      />
      <main className="px-4 space-y-3">
        {charts}
        {days.length < 7 && <Empty>Charts fill in as the days add up.</Empty>}
      </main>
    </>
  )
}

function ChartCard({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      <div className="h-48">{children}</div>
    </Card>
  )
}

type Week = ReturnType<typeof weeklyRollups>[number]
const weekTip = {
  labelFormatter: (_: unknown, p: readonly { payload?: { label?: string } }[]) => p?.[0]?.payload?.label ?? '',
}

// Weight — daily dots, 7-day average line.
function WeightChart({ daysIn }: { daysIn: typeof days }) {
  const series = useMemo(() => weightSeries(daysIn), [daysIn])
  const weights = series.map((p) => p.weight).filter((w): w is number => w !== undefined)
  if (weights.length === 0) return null
  const lo = Math.floor(Math.min(...weights) - 1)
  const hi = Math.ceil(Math.max(...weights) + 1)
  const step = Math.max(1, Math.ceil((hi - lo) / 4))
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step)
  return (
    <ChartCard title="Weight" sub="lb · line is the 7-day average">
      <ResponsiveContainer>
        <ComposedChart data={series} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={32} {...axis} />
          <YAxis domain={[lo, hi]} ticks={ticks} width={48} {...axis} />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(v, name) => [num(Number(v), 1), name === 'avg7' ? '7-day avg' : 'weight']}
          />
          <Line type="monotone" dataKey="avg7" stroke={C.s1} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Scatter dataKey="weight" fill={C.dot} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Miles per week — bars.
function MilesChart({ weeks }: { weeks: Week[] }) {
  const data = weeks.map((w) => ({ start: w.start, label: weekLabel(w.start, w.end), miles: w.totalMiles }))
  if (!data.some((d) => d.miles > 0)) return null
  return (
    <ChartCard title="Miles" sub="per week">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="start" tickFormatter={shortDate} {...axis} />
          <YAxis width={48} {...axis} />
          <Tooltip {...tooltipStyle} {...weekTip} formatter={(v) => [`${num(Number(v), 1)} mi`, '']} />
          <Bar dataKey="miles" fill={C.s1} radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Pace per week — line; axis reversed so up means faster.
function PaceChart({ weeks }: { weeks: Week[] }) {
  const data = weeks.map((w) => ({ start: w.start, label: weekLabel(w.start, w.end), pace: w.avgPace }))
  if (!data.some((d) => d.pace !== undefined)) return null
  return (
    <ChartCard title="Pace" sub="min/mi · higher is faster">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="start" tickFormatter={shortDate} {...axis} />
          <YAxis width={48} reversed domain={['dataMin - 30', 'dataMax + 30']} tickFormatter={(v) => pace(Number(v))} {...axis} />
          <Tooltip {...tooltipStyle} {...weekTip} formatter={(v) => [`${pace(Number(v))} /mi`, '']} />
          <Line type="monotone" dataKey="pace" stroke={C.s2} strokeWidth={2} dot={{ r: 4, fill: C.s2 }} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// Lifts — e1RM per tracked lift. Tap a pill to hide a line.
function LiftsChart({ daysIn }: { daysIn: typeof days }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const data = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>()
    for (const lift of config.tracked_lifts) {
      for (const p of dailyE1rm(lift, daysIn, config)) {
        const row = byDate.get(p.date) ?? { date: p.date }
        row[lift] = Math.round(p.e1rm)
        byDate.set(p.date, row)
      }
    }
    return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [daysIn])
  if (data.length === 0) return null
  const present = config.tracked_lifts.filter((l) => data.some((r) => r[l] !== undefined))
  const toggle = (key: string) =>
    setHidden((h) => {
      const n = new Set(h)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  return (
    <ChartCard title="Lifts" sub="estimated 1RM, lb">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={32} {...axis} />
          <YAxis width={48} domain={['auto', 'auto']} {...axis} />
          <Tooltip {...tooltipStyle} labelFormatter={(d) => shortDate(String(d))} />
          {present.map((lift) => (
            <Line
              key={lift}
              dataKey={lift}
              name={liftLabel(lift)}
              hide={hidden.has(lift)}
              stroke={LIFT_COLOR[lift] ?? C.text}
              strokeWidth={2}
              dot={{ r: 4, fill: LIFT_COLOR[lift] ?? C.text }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-3">
        {present.map((lift) => {
          const off = hidden.has(lift)
          return (
            <button
              key={lift}
              onClick={() => toggle(lift)}
              aria-pressed={!off}
              className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs ${off ? 'text-muted' : 'text-fg'}`}
            >
              <span className="size-2 rounded-full" style={{ background: LIFT_COLOR[lift], opacity: off ? 0.3 : 1 }} />
              {liftLabel(lift)}
            </button>
          )
        })}
      </div>
    </ChartCard>
  )
}

// Calories per week — only once fuel is being logged.
function CaloriesChart({ weeks }: { weeks: Week[] }) {
  const data = weeks.map((w) => ({ start: w.start, label: weekLabel(w.start, w.end), cals: w.avgCals }))
  if (!data.some((d) => d.cals !== undefined)) return null
  return (
    <ChartCard title="Calories" sub="daily average, per week">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={margin}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="start" tickFormatter={shortDate} {...axis} />
          <YAxis width={48} {...axis} />
          <Tooltip {...tooltipStyle} {...weekTip} formatter={(v) => [num(Number(v)), '']} />
          <Bar dataKey="cals" fill={C.s3} radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

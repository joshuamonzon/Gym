import { useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { config, days } from '../lib/data'
import { dailyE1rm, weeklyRollups, weightSeries } from '../lib/rollups'
import { addDays, todayLocal, weekStartOf } from '../lib/dates'
import { liftLabel, num, pace, shortDate, weekLabel } from '../lib/format'
import { Card, ScreenHeader, Segmented } from '../components/ui'

type Range = '4w' | '8w' | 'all'

/** Palette: validated categorical slots (light / dark). Hue follows the entity, never its rank. */
const DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
const C = DARK
  ? { s1: '#3987e5', s2: '#d95926', s3: '#199e70', s4: '#c98500', grid: '#2a2a31', text: '#8b8b94', tip: '#222228' }
  : { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', s4: '#eda100', grid: '#d9d9de', text: '#6b6b75', tip: '#ffffff' }
const LIFT_COLOR: Record<string, string> = { bench: C.s1, pullup: C.s2, row: C.s3, leg_press: C.s4 }

const tooltipStyle = {
  contentStyle: { background: C.tip, border: `1px solid ${C.grid}`, borderRadius: 8, fontSize: 12 },
  labelStyle: { color: C.text },
  itemStyle: { padding: 0 },
}
const axis = { tick: { fontSize: 11, fill: C.text }, axisLine: false, tickLine: false } as const

/** First day included for a range, anchored to the current week. */
function rangeStart(range: Range, today: string): string | undefined {
  if (range === 'all') return undefined
  const weeks = range === '4w' ? 4 : 8
  return addDays(weekStartOf(today), -7 * (weeks - 1))
}

export function Charts() {
  const [range, setRange] = useState<Range>('all')
  const today = todayLocal()
  const from = rangeStart(range, today)

  const weeks = useMemo(() => weeklyRollups(days, config).reverse(), []) // oldest → newest for the x-axis
  const weeksIn = useMemo(() => weeks.filter((w) => !from || w.start >= from), [weeks, from])
  const daysIn = useMemo(() => days.filter((d) => !from || d.date >= from), [from])

  return (
    <>
      <ScreenHeader
        title="Charts"
        right={
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
        }
      />
      <main className="px-4 space-y-3">
        <WeightChart daysIn={daysIn} />
        <FuelChart weeks={weeksIn} />
        <RunningChart weeks={weeksIn} />
        <LiftsChart daysIn={daysIn} />
      </main>
    </>
  )
}

function ChartCard({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between px-1 mb-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {right}
      </div>
      <div className="h-56">{children}</div>
    </Card>
  )
}

function NoData() {
  return <p className="h-full grid place-items-center text-sm text-muted">No data in range</p>
}

// 1. Weight — daily dots + 7-day average line; shift days as markers on the x-axis.
function WeightChart({ daysIn }: { daysIn: typeof days }) {
  const series = useMemo(() => weightSeries(daysIn), [daysIn])
  const shifts = series.filter((p) => p.shift).map((p) => ({ date: p.date, marker: 0 }))
  const weights = series.map((p) => p.weight).filter((w): w is number => w !== undefined)
  if (weights.length === 0) return <ChartCard title="Weight"><NoData /></ChartCard>
  const lo = Math.floor(Math.min(...weights) - 1)
  const hi = Math.ceil(Math.max(...weights) + 1)
  const step = Math.max(1, Math.ceil((hi - lo) / 5))
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step)
  return (
    <ChartCard title="Weight (lb) · dots daily, line 7-day avg">
      <ResponsiveContainer>
        <ComposedChart data={series} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
          <YAxis domain={[lo, hi]} ticks={ticks} width={44} {...axis} />
          <YAxis yAxisId="marker" hide domain={[0, 1]} />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(v, name) => (name === 'marker' ? ['24-hr shift', ''] : [num(Number(v), 1), String(name)])}
          />
          <Line type="monotone" dataKey="avg7" name="7-day avg" stroke={C.s1} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Scatter dataKey="weight" name="weight" fill={C.text} isAnimationActive={false} />
          <Scatter yAxisId="marker" data={shifts} dataKey="marker" name="marker" fill={C.s2} shape="triangle" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

type Week = ReturnType<typeof weeklyRollups>[number]

// 2. Fuel vs weight — weekly bars: cals (primary) and carbs (secondary axis), weekly avg weight line.
function FuelChart({ weeks }: { weeks: Week[] }) {
  const data = weeks.map((w) => ({ start: w.start, label: weekLabel(w.start, w.end), cals: w.avgCals, carbs: w.avgCarbs, weight: w.avgWeight }))
  const any = data.some((d) => d.cals !== undefined || d.carbs !== undefined || d.weight !== undefined)
  if (!any) return <ChartCard title="Fuel vs weight"><NoData /></ChartCard>
  return (
    <ChartCard title="Fuel vs weight · weekly">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 0, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="start" tickFormatter={shortDate} {...axis} />
          <YAxis yAxisId="cals" width={44} {...axis} />
          <YAxis yAxisId="carbs" orientation="right" width={40} {...axis} />
          <YAxis yAxisId="weight" hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip {...tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} formatter={(v, name) => [num(Number(v), name === 'avg weight' ? 1 : 0), String(name)]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="cals" dataKey="cals" name="cals" fill={C.s1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar yAxisId="carbs" dataKey="carbs" name="carbs (g)" fill={C.s2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="weight" type="monotone" dataKey="weight" name="avg weight" stroke={C.s3} strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 3. Running — weekly miles bars + aerobic efficiency line; toggle to avg pace.
function RunningChart({ weeks }: { weeks: Week[] }) {
  const [line, setLine] = useState<'eff' | 'pace'>('eff')
  const data = weeks.map((w) => ({ start: w.start, label: weekLabel(w.start, w.end), miles: w.totalMiles, eff: w.efficiency, pace: w.avgPace }))
  if (!data.some((d) => d.miles > 0)) return <ChartCard title="Running"><NoData /></ChartCard>
  const toggle = (
    <Segmented
      ariaLabel="Line"
      value={line}
      onChange={setLine}
      options={[
        { value: 'eff', label: 'Efficiency' },
        { value: 'pace', label: 'Pace' },
      ]}
    />
  )
  return (
    <ChartCard title="Running · weekly" right={toggle}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="start" tickFormatter={shortDate} {...axis} />
          <YAxis yAxisId="miles" width={44} {...axis} />
          <YAxis
            yAxisId="line"
            orientation="right"
            width={48}
            domain={line === 'eff' ? ['dataMin - 0.05', 'dataMax + 0.05'] : ['dataMin - 30', 'dataMax + 30']}
            tickFormatter={(v) => (line === 'eff' ? num(Number(v), 2) : pace(Number(v)))}
            reversed={line === 'pace'}
            {...axis}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
            formatter={(v, name) => [name === 'pace' ? `${pace(Number(v))} /mi` : num(Number(v), name === 'miles' ? 2 : 3), String(name)]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="miles" dataKey="miles" name="miles" fill={C.s1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          {line === 'eff' ? (
            <Line yAxisId="line" type="monotone" dataKey="eff" name="efficiency" stroke={C.s2} strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
          ) : (
            <Line yAxisId="line" type="monotone" dataKey="pace" name="pace" stroke={C.s2} strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 4. Lifts — e1RM lines per tracked lift, toggleable legend.
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
  if (data.length === 0) return <ChartCard title="Lifts"><NoData /></ChartCard>
  const toggle = (key: string) =>
    setHidden((h) => {
      const n = new Set(h)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  return (
    <ChartCard title="Lifts · e1RM (lb)">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axis} />
          <YAxis width={44} domain={['auto', 'auto']} {...axis} />
          <Tooltip {...tooltipStyle} labelFormatter={(d) => shortDate(String(d))} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
            onClick={(e) => toggle(String(e.dataKey))}
            formatter={(value, entry) => (
              <span style={{ opacity: hidden.has(String(entry.dataKey)) ? 0.4 : 1 }}>{value}</span>
            )}
          />
          {config.tracked_lifts.map((lift) => (
            <Line
              key={lift}
              dataKey={lift}
              name={liftLabel(lift)}
              hide={hidden.has(lift)}
              stroke={LIFT_COLOR[lift] ?? C.text}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

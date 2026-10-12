import { useMemo } from 'react'
import { config, days } from '../lib/data'
import type { Day } from '../lib/schema'
import { mean, paceSecPerMile, swimPaceSecPer100m, weightSeries } from '../lib/rollups'
import { addDays, weekStartOf } from '../lib/dates'
import { mmss, num, shortDate } from '../lib/format'

const byDate = new Map(days.map((d) => [d.date, d]))
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dow = (date: string) => DOW[new Date(`${date}T00:00:00Z`).getUTCDay()]
const dayNum = (date: string) => Number(date.slice(8, 10))
const f1 = (n: number) => n.toFixed(1)

/** Chart geometry shared by every card: 330 wide, 14px side padding. */
const W = 330
const PX = 14

/** Week strip, then one stat card per metric. Charts are inline SVG. */
export function Week({ today }: { today: string }) {
  const monday = weekStartOf(today)
  const sunday = addDays(monday, 6)
  const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((date) => ({ date, day: byDate.get(date) }))

  return (
    <>
      <div className="sec">
        Week of {shortDate(monday)}–{dayNum(sunday)}
      </div>
      <WeekStrip week={week} today={today} />
      <div className="stats">
        <CalorieCard week={week} today={today} />
        <WeightCard today={today} />
        <RunsCard today={today} />
        <SwimsCard today={today} />
        <SleepCard today={today} />
      </div>
    </>
  )
}

type WeekDay = { date: string; day: Day | undefined }

function WeekStrip({ week, today }: { week: WeekDay[]; today: string }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div className="wk">
        {week.map(({ date, day }) => {
          const marks: string[] = []
          if (day?.run) marks.push('m-run')
          if (day?.swim) marks.push('m-swim')
          if (day?.bike_min) marks.push('m-bike')
          if (day?.lifts?.length) marks.push('m-lift')
          if (marks.length === 0) marks.push(day?.plan && date >= today ? 'm-plan' : 'm-none')
          const sh = day?.shift === true ? 'shift' : byDate.get(addDays(date, -1))?.shift === true ? 'off sh.' : ''
          return (
            <div key={date} className={`day${date === today ? ' today' : ''}`}>
              <span className="dn">{dow(date)}</span>
              <span className="dd">{dayNum(date)}</span>
              <span className="marks">
                {marks.map((m) => (
                  <i key={m} className={m} />
                ))}
              </span>
              <span className="sh">{sh}</span>
            </div>
          )
        })}
      </div>
      <div className="wk-legend">
        <span>
          <i style={{ background: 'var(--accent)' }} />
          run
        </span>
        <span>
          <i style={{ background: 'var(--accent)', opacity: 0.55 }} />
          swim
        </span>
        <span>
          <i style={{ background: 'var(--ink)' }} />
          lift
        </span>
        <span>
          <i style={{ border: '1.5px solid var(--line2)' }} />
          planned
        </span>
      </div>
    </div>
  )
}

function Axis({ labels, today }: { labels: { date: string; text: string }[]; today?: string }) {
  return (
    <div className="axis" style={{ '--cols': labels.length } as React.CSSProperties}>
      {labels.map((l) => (
        <span key={l.date} className={l.date === today ? 't' : ''}>
          {l.text}
        </span>
      ))}
    </div>
  )
}

// ---------- calories ----------

function CalorieCard({ week, today }: { week: WeekDay[]; today: string }) {
  const target = config.cal_target
  const logged = week.filter((w) => w.day?.cals !== undefined)
  const lastLogged = [...days].reverse().find((d) => d.cals !== undefined)
  if (target === undefined || lastLogged === undefined) return null
  const balance = logged.reduce((acc, w) => acc + (w.day!.cals! - target), 0)
  const H = 96
  const cmax = Math.max(3400, target * 1.4, ...logged.map((w) => w.day!.cals!)) * 1.02
  const cy = (v: number) => H - 6 - (v / cmax) * (H - 18)
  const bw = (W - 2 * PX) / 7
  const gap = 8
  return (
    <div className="stat wide">
      <div className="l">
        Calorie balance <span>{logged.length} of 7 days logged</span>
      </div>
      <div className={`v ${balance > 0 ? 'over' : 'under'}`}>
        {balance > 0 ? '+' : ''}
        {num(balance)}
        <small>vs {num(target)}/day</small>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} aria-label={`Calories this week vs ${num(target)}`}>
        {week.map((w, i) => {
          const x = PX + i * bw + gap / 2
          const width = bw - gap
          const cals = w.day?.cals
          if (cals !== undefined) {
            const y = cy(cals)
            return (
              <g key={w.date}>
                <rect x={f1(x)} y={f1(y)} width={f1(width)} height={f1(H - 6 - y)} rx="4" fill={cals > target ? 'var(--bad)' : 'var(--good)'} />
                <text className="lv" x={f1(x + width / 2)} y={f1(y - 4)} textAnchor="middle">
                  {num(cals)}
                </text>
              </g>
            )
          }
          if (w.date < today) {
            const y = cy(600)
            return (
              <g key={w.date}>
                <rect x={f1(x)} y={f1(y)} width={f1(width)} height={f1(H - 6 - y)} rx="4" fill="none" stroke="var(--line2)" strokeDasharray="3 3" />
                <text x={f1(x + width / 2)} y={f1(y - 4)} textAnchor="middle">
                  —
                </text>
              </g>
            )
          }
          return null
        })}
        <line className="tgt" x1={PX} x2={W - PX} y1={f1(cy(target))} y2={f1(cy(target))} />
        <text x={W - PX} y={f1(cy(target) - 4)} textAnchor="end">
          {num(target)}
        </text>
      </svg>
      <Axis labels={week.map((w) => ({ date: w.date, text: dow(w.date)[0] }))} today={today} />
      <div className="d">
        Last logged {shortDate(lastLogged.date)}: {num(lastLogged.cals)} cal
        {lastLogged.protein_g !== undefined && ` · ${num(lastLogged.protein_g)}g protein`}. An over day is corrected by the next day's food, not extra
        cardio.
      </div>
    </div>
  )
}

// ---------- weight ----------

const WINDOW_DAYS = 10

function WeightCard({ today }: { today: string }) {
  const series = useMemo(() => weightSeries(days).filter((p) => p.date <= today && p.date > addDays(today, -WINDOW_DAYS)), [today])
  const weighed = series.filter((p) => p.weight !== undefined)
  const latest = [...days].reverse().find((d) => d.weight_lb !== undefined)
  if (!latest || series.length === 0) return null
  const avg7 = mean(days.filter((d) => d.date <= today && d.date > addDays(today, -7) && d.weight_lb !== undefined).map((d) => d.weight_lb!))
  const delta = avg7 !== undefined ? latest.weight_lb! - avg7 : undefined
  const H = 90
  const PY = 14
  const n = series.length
  const X = (i: number) => PX + (n > 1 ? (i / (n - 1)) * (W - 2 * PX) : (W - 2 * PX) / 2)
  const vals = [...weighed.map((p) => p.weight!), ...series.map((p) => p.avg7).filter((v): v is number => v !== undefined)]
  const lo = Math.min(...vals) - 0.8
  const hi = Math.max(...vals) + 0.8
  const Y = (v: number) => PY + (1 - (v - lo) / (hi - lo)) * (H - 2 * PY)
  const pts = series.map((p, i) => ({ ...p, x: X(i) }))
  const wPath = pts
    .filter((p) => p.weight !== undefined)
    .map((p, i) => `${i ? 'L' : 'M'}${f1(p.x)},${f1(Y(p.weight!))}`)
    .join(' ')
  const aPath = pts
    .filter((p) => p.avg7 !== undefined)
    .map((p, i) => `${i ? 'L' : 'M'}${f1(p.x)},${f1(Y(p.avg7!))}`)
    .join(' ')
  const labelAll = weighed.length <= 7
  return (
    <div className="stat wide">
      <div className="l">
        Weight <span>last {shortDate(latest.date)}</span>
      </div>
      <div className="v">
        {num(latest.weight_lb, 1)}
        <small>lb</small>
      </div>
      <div className={`d ${delta !== undefined && delta > 0.5 ? 'up' : delta !== undefined && delta < -0.5 ? 'ok' : ''}`}>
        {delta !== undefined && `${delta >= 0 ? '+' : ''}${num(delta, 1)} vs 7-day avg ${num(avg7, 1)} (dashed) · `}start {num(config.start_weight_lb, 1)}
        {latest.date !== today && ' · no weigh-in today'}
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} aria-label={`Weight, last ${WINDOW_DAYS} days`}>
        {aPath && <path className="tgt" d={aPath} fill="none" strokeLinejoin="round" />}
        {wPath && <path d={wPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {pts
          .filter((p) => p.weight !== undefined)
          .map((p, i, arr) => {
            const last = i === arr.length - 1
            return (
              <g key={p.date}>
                <circle cx={f1(p.x)} cy={f1(Y(p.weight!))} r={last ? 4 : 3} fill={last ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="1.5" />
                {(labelAll || last) && (
                  <text className="lv" x={f1(p.x)} y={f1(Y(p.weight!) - 8)} textAnchor="middle">
                    {num(p.weight, 1)}
                  </text>
                )}
              </g>
            )
          })}
      </svg>
      <Axis labels={series.map((p) => ({ date: p.date, text: String(dayNum(p.date)) }))} today={today} />
    </div>
  )
}

// ---------- runs ----------

const MAX_POINTS = 10

function RunsCard({ today }: { today: string }) {
  const runs = days.filter((d) => d.date <= today && d.run?.miles && d.run.seconds).slice(-MAX_POINTS)
  if (runs.length === 0) return null
  const H = 84
  const paces = runs.map((d) => paceSecPerMile(d.run!)!)
  const lo = Math.min(...paces) - 20
  const hi = Math.max(...paces) + 20
  const Y = (p: number) => 12 + ((p - lo) / (hi - lo)) * (H - 30)
  const X = (i: number) => PX + (i + 0.5) * ((W - 2 * PX) / runs.length)
  const lastHr = runs[runs.length - 1].run!.avg_hr
  return (
    <div className="stat wide">
      <div className="l">
        Runs <span>pace /mi · avg HR</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} aria-label="Run pace and heart rate">
        {runs.map((d, i) => {
          const p = paces[i]
          return (
            <g key={d.date}>
              <line x1={f1(X(i))} x2={f1(X(i))} y1={f1(Y(p))} y2={H - 14} stroke="var(--line)" />
              <circle cx={f1(X(i))} cy={f1(Y(p))} r="5" fill="var(--accent)" />
              <text className="lv" x={f1(X(i))} y={f1(Y(p) - 9)} textAnchor="middle">
                {mmss(p)}
              </text>
              {d.run!.avg_hr !== undefined && (
                <text x={f1(X(i))} y={H - 2} textAnchor="middle">
                  {d.run!.avg_hr}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <Axis labels={runs.map((d) => ({ date: d.date, text: String(dayNum(d.date)) }))} today={today} />
      <div className="d">
        Higher = faster. Garmin run-only, treadmill-calibrated.
        {lastHr !== undefined && ` Last run ${num(runs[runs.length - 1].run!.miles, 2)} mi at ${lastHr} bpm.`}
      </div>
    </div>
  )
}

// ---------- swims ----------

function SwimsCard({ today }: { today: string }) {
  const swims = days.filter((d) => d.date <= today && d.swim).slice(-MAX_POINTS)
  if (swims.length === 0) return null
  const H = 84
  const paces = swims.map((d) => swimPaceSecPer100m(d.swim!))
  const lo = Math.min(...paces) - 10
  const hi = Math.max(...paces) + 10
  const Y = (p: number) => 12 + ((p - lo) / (hi - lo)) * (H - 30)
  const X = (i: number) => PX + (i + 0.5) * ((W - 2 * PX) / swims.length)
  const last = swims[swims.length - 1].swim!
  return (
    <div className="stat wide">
      <div className="l">
        Swims <span>pace /100m · meters</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} aria-label="Swim pace per 100 m">
        {swims.map((d, i) => {
          const p = paces[i]
          return (
            <g key={d.date}>
              <line x1={f1(X(i))} x2={f1(X(i))} y1={f1(Y(p))} y2={H - 14} stroke="var(--line)" />
              <circle cx={f1(X(i))} cy={f1(Y(p))} r="5" fill="var(--accent)" fillOpacity="0.55" stroke="var(--accent)" strokeWidth="1.5" />
              <text className="lv" x={f1(X(i))} y={f1(Y(p) - 9)} textAnchor="middle">
                {mmss(p)}
              </text>
              <text x={f1(X(i))} y={H - 2} textAnchor="middle">
                {num(d.swim!.meters)}
              </text>
            </g>
          )
        })}
      </svg>
      <Axis labels={swims.map((d) => ({ date: d.date, text: String(dayNum(d.date)) }))} today={today} />
      <div className="d">
        Higher = faster. Last swim {num(last.meters)} m in {mmss(last.seconds)}
        {last.avg_hr !== undefined && ` · ${last.avg_hr} bpm`}
        {last.swolf !== undefined && ` · SWOLF ${num(last.swolf)}`}.
      </div>
    </div>
  )
}

// ---------- sleep ----------

function SleepCard({ today }: { today: string }) {
  const window = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, i - (WINDOW_DAYS - 1)))
  const lastSleep = [...days].reverse().find((d) => d.sleep_h !== undefined)
  if (!lastSleep) return null
  const H = 70
  const slot = (W - 2 * PX) / window.length
  const maxH = Math.max(9, ...window.map((date) => byDate.get(date)?.sleep_h ?? 0))
  return (
    <div className="stat wide">
      <div className="l">
        Sleep <span>last {shortDate(lastSleep.date)}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} aria-label="Sleep hours">
        {window.map((date, i) => {
          const x = PX + i * slot + 4
          const width = slot - 8
          const s = byDate.get(date)?.sleep_h
          if (s === undefined) {
            return date < today ? (
              <text key={date} x={f1(x + width / 2)} y="58" textAnchor="middle">
                —
              </text>
            ) : null
          }
          const h = (s / maxH) * 48
          const y = 60 - h
          const hrs = Math.floor(s)
          const mins = String(Math.round((s % 1) * 60)).padStart(2, '0')
          return (
            <g key={date}>
              <rect x={f1(x)} y={f1(y)} width={f1(width)} height={f1(h)} rx="3" fill={s < 6 ? 'var(--warn)' : 'var(--ink2)'} />
              <text className="lv" x={f1(x + width / 2)} y={f1(y - 4)} textAnchor="middle">
                {hrs}h{mins}
              </text>
            </g>
          )
        })}
        <line className="gridline" x1={PX} x2={W - PX} y1="60" y2="60" />
      </svg>
      <Axis labels={window.map((date) => ({ date, text: String(dayNum(date)) }))} today={today} />
      {lastSleep.sleep_h! < 6 && <div className="d warn">Short night → keep the run easy.</div>}
    </div>
  )
}

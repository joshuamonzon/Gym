import { days } from '../lib/data'
import type { Day } from '../lib/schema'
import { dowDate } from '../lib/format'
import { Card, Empty, ScreenHeader } from '../components/ui'

/** Raw day entries, newest first, shown exactly as stored. The audit view. */
export function Log() {
  const list = [...days].reverse()
  return (
    <>
      <ScreenHeader title="Log" />
      <main className="px-4 space-y-3">
        {list.length === 0 && <Empty>No day files yet.</Empty>}
        {list.map((d) => (
          <Entry key={d.date} day={d} />
        ))}
      </main>
    </>
  )
}

function Entry({ day }: { day: Day }) {
  const rows: [string, string][] = []
  if (day.weight_lb !== undefined) rows.push(['weight_lb', String(day.weight_lb)])
  if (day.cals !== undefined) rows.push(['cals', String(day.cals)])
  if (day.protein_g !== undefined) rows.push(['protein_g', String(day.protein_g)])
  if (day.carbs_g !== undefined) rows.push(['carbs_g', String(day.carbs_g)])
  if (day.sleep_h !== undefined) rows.push(['sleep_h', String(day.sleep_h)])
  if (day.shift !== undefined) rows.push(['shift', String(day.shift)])
  if (day.run) {
    const r = day.run
    rows.push([
      'run',
      [
        r.miles !== undefined && `${r.miles} mi`,
        r.seconds !== undefined && `${r.seconds} s`,
        r.avg_hr !== undefined && `${r.avg_hr} bpm`,
        r.surface,
      ]
        .filter(Boolean)
        .join(' · '),
    ])
  }
  if (day.bike_min !== undefined) rows.push(['bike_min', String(day.bike_min)])
  for (const s of day.lifts ?? []) rows.push(['lift', `${s.lift} ${s.weight}×${s.reps}`])

  return (
    <Card className="p-4">
      <h2 className="font-semibold">{dowDate(day.date)}</h2>
      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {rows.map(([k, v], i) => (
            <div key={i} className="contents">
              <dt className="text-muted font-mono text-xs leading-5">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {day.note && <p className="mt-3 text-sm text-fg/90 leading-snug">{day.note}</p>}
    </Card>
  )
}

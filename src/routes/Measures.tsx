import { lazy, Suspense, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, NumberField } from '@/components/ui/Inputs'
import { Spinner, Empty } from '@/components/ui/Empty'
import { ListGroup, ListRow } from '@/components/ui/ListRow'
import { useSettings } from '@/hooks/useSettings'
import { useNow } from '@/hooks/useNow'
import { deleteMeasurement, upsertMeasurement } from '@/db/repo/measurements'
import { updateSettings } from '@/db/repo/settings'
import { formatLocalDate, parseLocalDate, toLocalDate } from '@/domain/dates'
import { WAIST_TO_HEIGHT_BAND, waistTargetIn, waistToHeightPct } from '@/domain/measures'
import { formatWeight, fromDisplay, toDisplay } from '@/domain/units'

const MeasureLineChart = lazy(() => import('@/components/charts/MeasureLineChart'))
const IN_PER_CM = 1 / 2.54

export default function Measures() {
  const settings = useSettings()
  const rows = useLiveQuery(() => db.measurements.orderBy('date').toArray(), [])
  const today = toLocalDate(useNow(60_000))
  const [date, setDate] = useState(today)
  const metric = settings.unit === 'kg'
  const lenUnit = metric ? 'cm' : 'in'
  const toLen = (inches: number | null | undefined) => (inches === null || inches === undefined ? null : Math.round((metric ? inches / IN_PER_CM : inches) * 10) / 10)
  const fromLen = (v: number) => (metric ? v * IN_PER_CM : v)
  if (!rows) return <Spinner />
  const current = rows.find((r) => r.date === date)
  const latestWaist = [...rows].reverse().find((r) => r.waistIn !== undefined)
  const pct = waistToHeightPct(latestWaist?.waistIn, settings.heightIn)
  const target = waistTargetIn(settings.heightIn)
  const label = (d: string) => {
    const x = parseLocalDate(d)
    return `${x.toLocaleString(undefined, { month: 'short' })} ${x.getDate()}`
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar back="/profile" title="Measures" />
      <Card className="mb-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-[16px] text-white outline-none focus:border-accent" />
          </Field>
          <Field label={`Height (${lenUnit})`}>
            <NumberField value={toLen(settings.heightIn)} decimals={1} onCommit={(v) => void updateSettings({ heightIn: v === null ? null : fromLen(v) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Bodyweight (${metric ? 'kg' : 'lbs'})`}>
            <NumberField value={current?.weightLb === undefined ? null : toDisplay(current.weightLb, settings.unit)} decimals={1} onCommit={(v) => void upsertMeasurement(date, { weightLb: v === null ? undefined : fromDisplay(v, settings.unit) })} placeholder="—" />
          </Field>
          <Field label={`Waist at navel (${lenUnit})`} hint="Measure in the morning">
            <NumberField value={toLen(current?.waistIn)} decimals={1} onCommit={(v) => void upsertMeasurement(date, { waistIn: v === null ? undefined : fromLen(v) })} placeholder="—" />
          </Field>
        </div>
        {pct !== null && (
          <p className="text-sm text-muted">
            Waist-to-height: <span className={pct >= WAIST_TO_HEIGHT_BAND[0] && pct <= WAIST_TO_HEIGHT_BAND[1] ? 'font-semibold text-success' : 'text-white'}>{pct}%</span> (ideal {WAIST_TO_HEIGHT_BAND[0]}–{WAIST_TO_HEIGHT_BAND[1]}%
            {target ? `, i.e. ${toLen(target[0])}–${toLen(target[1])} ${lenUnit}` : ''})
          </p>
        )}
        {pct === null && <p className="text-sm text-muted">Enter your height and waist to see the waist-to-height ratio (ideal 44–45%).</p>}
      </Card>

      {rows.filter((r) => r.weightLb !== undefined).length > 1 && (
        <Card className="mb-3">
          <div className="mb-1 text-sm text-muted">Bodyweight</div>
          <Suspense fallback={<Spinner />}>
            <MeasureLineChart data={rows.filter((r) => r.weightLb !== undefined).map((r) => ({ label: label(r.date), value: toDisplay(r.weightLb!, settings.unit) }))} unit={metric ? 'kg' : 'lbs'} />
          </Suspense>
        </Card>
      )}
      {rows.filter((r) => r.waistIn !== undefined).length > 1 && (
        <Card className="mb-3">
          <div className="mb-1 text-sm text-muted">Waist</div>
          <Suspense fallback={<Spinner />}>
            <MeasureLineChart data={rows.filter((r) => r.waistIn !== undefined).map((r) => ({ label: label(r.date), value: toLen(r.waistIn)! }))} unit={lenUnit} band={target ? [toLen(target[0])!, toLen(target[1])!] : undefined} />
          </Suspense>
        </Card>
      )}

      {rows.length === 0 ? (
        <Empty title="No measurements yet" />
      ) : (
        <ListGroup title="Log">
          {[...rows].reverse().map((r) => (
            <ListRow
              key={r.date}
              label={formatLocalDate(r.date, { year: true })}
              sub={[r.weightLb !== undefined ? formatWeight(r.weightLb, settings.unit) : null, r.waistIn !== undefined ? `waist ${toLen(r.waistIn)} ${lenUnit}` : null].filter(Boolean).join(' · ')}
              value={<Button size="sm" variant="ghost" onClick={() => void deleteMeasurement(r.date)}>Delete</Button>}
              chevron={false}
            />
          ))}
        </ListGroup>
      )}
    </div>
  )
}

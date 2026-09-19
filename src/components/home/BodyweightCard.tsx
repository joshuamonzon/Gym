import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { Card } from '@/components/ui/Card'
import { NumberField } from '@/components/ui/Inputs'
import { ChevronRight } from '@/components/ui/Icons'
import { useSettings } from '@/hooks/useSettings'
import { upsertMeasurement } from '@/db/repo/measurements'
import { bodyweightChange } from '@/domain/measures'
import { formatLocalDate } from '@/domain/dates'
import { formatWeight, fromDisplay, toDisplay } from '@/domain/units'

export function BodyweightCard({ today }: { today: string }) {
  const rows = useLiveQuery(() => db.measurements.orderBy('date').toArray(), [])
  const settings = useSettings()
  const unit = settings.unit
  const summary = bodyweightChange(rows ?? [], today)
  const todayRow = rows?.find((r) => r.date === today)
  const delta = summary?.deltaLb ?? null
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bodyweight</h3>
        <Link to="/measures" className="flex items-center text-sm font-semibold text-accent">
          Waist & charts <ChevronRight size={16} />
        </Link>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          {summary ? (
            <>
              <div className="text-3xl font-bold">{formatWeight(summary.latestLb, unit)}</div>
              <div className="text-sm text-muted">
                {summary.latestDate === today ? 'Today' : formatLocalDate(summary.latestDate)}
                {delta !== null && summary.baselineDate && (
                  <>
                    {' · '}
                    <span className={delta > 0 ? 'text-warn' : delta < 0 ? 'text-success' : ''}>
                      {delta > 0 ? '+' : ''}
                      {formatWeight(delta, unit)}
                    </span>{' '}
                    since {formatLocalDate(summary.baselineDate)}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted">Log it each morning to track the trend and unlock bodyweight-relative Key Lift targets.</div>
          )}
        </div>
        <label className="w-28 shrink-0">
          <span className="mb-1 block text-center text-xs text-muted">Today ({unit === 'kg' ? 'kg' : 'lbs'})</span>
          <NumberField
            value={todayRow?.weightLb === undefined ? null : toDisplay(todayRow.weightLb, unit)}
            decimals={1}
            placeholder={summary ? String(toDisplay(summary.latestLb, unit)) : '—'}
            onCommit={(v) => void upsertMeasurement(today, { weightLb: v === null ? undefined : fromDisplay(v, unit) })}
          />
        </label>
      </div>
    </Card>
  )
}

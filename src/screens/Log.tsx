import { days } from '../lib/data'
import type { Day } from '../lib/schema'
import { dowDate } from '../lib/format'
import { Card, Empty, ScreenHeader } from '../components/ui'
import { bodyLine, fuelLine, liftsLine, runLine } from '../lib/summary'

/** Every day entry, newest first, written out in plain words. */
export function Log() {
  const list = [...days].reverse()
  return (
    <>
      <ScreenHeader title="Log" />
      <main className="px-4 space-y-3">
        {list.length === 0 && <Empty>No days logged yet.</Empty>}
        {list.map((d) => (
          <Entry key={d.date} day={d} />
        ))}
      </main>
    </>
  )
}

function Entry({ day }: { day: Day }) {
  const facts = [
    ['Run', runLine(day, true)],
    ['Lifts', liftsLine(day)],
    ['Body', bodyLine(day)],
    ['Fuel', fuelLine(day)],
  ].filter((f): f is [string, string] => !!f[1])

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{dowDate(day.date)}</h2>
      {facts.length > 0 && (
        <div className="mt-3 space-y-2">
          {facts.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[3.25rem_1fr] gap-3 text-sm">
              <span className="text-muted">{k}</span>
              <span className="tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      )}
      {day.note && <p className="mt-4 text-sm text-muted leading-snug">{day.note}</p>}
    </Card>
  )
}

import { useMemo } from 'react'
import { config, days } from '../lib/data'
import { nowStats } from '../lib/rollups'
import { todayLocal } from '../lib/dates'
import { mmss, num, shortDate, signed } from '../lib/format'
import { Card, ScreenHeader, Stat } from '../components/ui'
import { deltaTone } from '../lib/tone'

export function Now() {
  const today = todayLocal()
  const n = useMemo(() => nowStats(days, config, today), [today])
  const dayLabel =
    n.challengeDay === undefined
      ? `starts ${shortDate(config.challenge.start)}`
      : n.challengeDay > n.challengeLength
        ? 'done'
        : `day ${n.challengeDay}/${n.challengeLength}`

  return (
    <>
      <ScreenHeader title="Now" right={<span className="text-xs text-muted">{shortDate(today)}</span>} />
      <main className="px-4 space-y-3">
        <Card className="p-4 grid grid-cols-3 gap-3">
          <Stat
            label={n.latestWeight && n.latestWeight.date === today ? 'Weight today' : 'Latest weight'}
            value={num(n.latestWeight?.weight, 1)}
            sub={n.latestWeight && n.latestWeight.date !== today ? shortDate(n.latestWeight.date) : 'lb'}
          />
          <Stat label="Δ vs start" value={signed(n.deltaFromStart, 1)} tone={deltaTone(n.deltaFromStart, 'down')} sub={`from ${num(config.start_weight_lb, 1)}`} />
          <Stat label="7-day avg" value={num(n.avg7Weight, 1)} sub="lb" />
        </Card>

        <Card className="p-4 grid grid-cols-2 gap-3">
          <Stat label="7-day avg cals" value={num(n.avg7Cals)} />
          <Stat label="7-day avg carbs" value={num(n.avg7Carbs)} sub="g" />
        </Card>

        <Card className="p-4 grid grid-cols-2 gap-3">
          <Stat label={config.challenge.name} value={dayLabel} />
          <Stat label="Streak" value={String(n.streak)} sub={`day${n.streak === 1 ? '' : 's'} ≥ 3.1 mi`} />
        </Card>

        <Card className="p-4 grid grid-cols-2 gap-3">
          <Stat label="Best 5K this month" value={mmss(n.best5kSeconds)} />
          <Stat label="Bench e1RM" value={num(n.benchE1rm)} sub="lb" />
        </Card>

        <p className="text-sm text-muted px-1 tabular-nums">
          This week so far: {num(n.thisWeek.miles, 2)} mi · {n.thisWeek.runDays} run day{n.thisWeek.runDays === 1 ? '' : 's'} ·{' '}
          {n.thisWeek.liftDays} lift day{n.thisWeek.liftDays === 1 ? '' : 's'}
        </p>
      </main>
    </>
  )
}

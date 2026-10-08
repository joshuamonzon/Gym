import { useMemo } from 'react'
import { config, days } from '../lib/data'
import { nowStats } from '../lib/rollups'
import { todayLocal } from '../lib/dates'
import { mmss, num, shortDate, signed } from '../lib/format'
import { Card, Hero, ScreenHeader, Stat } from '../components/ui'
import { deltaTone, toneCls } from '../lib/tone'
import { TodayCard } from '../components/TodayCard'

/**
 * Three things, top to bottom: where you are in the challenge, what you weigh,
 * what you've done this week. Anything not logged yet is left out, not dashed.
 */
export function Now() {
  const today = todayLocal()
  const n = useMemo(() => nowStats(days, config, today), [today])

  const started = n.challengeDay !== undefined
  const done = started && n.challengeDay! > n.challengeLength
  const hasWeight = n.latestWeight !== undefined
  const hasFuel = n.avg7Cals !== undefined || n.avg7Carbs !== undefined

  return (
    <>
      <ScreenHeader title="Today" right={<span className="text-sm text-muted">{shortDate(today)}</span>} />
      <main className="px-4 space-y-3">
        <TodayCard date={today} plan={days.find((d) => d.date === today)?.plan} />

        {/* Challenge */}
        <Card className="p-5">
          {!started ? (
            <Hero label={config.challenge.name} value="Soon" sub={`Starts ${shortDate(config.challenge.start)}`} />
          ) : done ? (
            <Hero label={config.challenge.name} value="Done" sub={`${n.challengeLength} days`} />
          ) : (
            <Hero
              label={config.challenge.name}
              value={`Day ${n.challengeDay}`}
              unit={`of ${n.challengeLength}`}
              sub={
                n.streak > 0
                  ? `${n.streak}-day streak`
                  : 'No streak yet — a 5K today starts one'
              }
            />
          )}
          {started && !done && (
            <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, ((n.challengeDay! - 1) / n.challengeLength) * 100)}%` }}
              />
            </div>
          )}
        </Card>

        {/* Weight */}
        {hasWeight && (
          <Card className="p-5">
            <Hero
              label={n.latestWeight!.date === today ? 'Weight today' : `Weight · ${shortDate(n.latestWeight!.date)}`}
              value={num(n.latestWeight!.weight, 1)}
              unit="lb"
              sub={
                n.deltaFromStart !== undefined && Math.abs(n.deltaFromStart) >= 0.05 ? (
                  <span className={toneCls(deltaTone(n.deltaFromStart, 'down'))}>
                    {signed(n.deltaFromStart, 1)} lb from {num(config.start_weight_lb, 1)}
                  </span>
                ) : (
                  'Starting weight'
                )
              }
            />
          </Card>
        )}

        {/* This week */}
        <Card className="p-5">
          <div className="text-sm text-muted mb-3">This week</div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Miles" value={num(n.thisWeek.miles, 1)} />
            <Stat label="Runs" value={String(n.thisWeek.runDays)} />
            <Stat label="Lifts" value={String(n.thisWeek.liftDays)} />
          </div>
          {n.thisWeek.estBurn > 0 && (
            <p className="mt-4 text-sm text-muted">
              ~{num(n.thisWeek.estBurn)} cal burned running
              {n.avg7Cals !== undefined && ` · eating ${num(n.avg7Cals)}/day`}
            </p>
          )}
        </Card>

        {/* Bests — only once there's something to show */}
        {(n.best5kSeconds !== undefined || n.benchE1rm !== undefined) && (
          <Card className="p-5">
            <div className="text-sm text-muted mb-3">Bests</div>
            <div className="grid grid-cols-2 gap-3">
              {n.best5kSeconds !== undefined && <Stat label="5K this month" value={mmss(n.best5kSeconds)} />}
              {n.benchE1rm !== undefined && <Stat label="Bench e1RM" value={num(n.benchE1rm)} unit="lb" />}
            </div>
          </Card>
        )}

        {hasFuel && (
          <Card className="p-5">
            <div className="text-sm text-muted mb-3">7-day fuel</div>
            <div className="grid grid-cols-2 gap-3">
              {n.avg7Cals !== undefined && <Stat label="Calories" value={num(n.avg7Cals)} />}
              {n.avg7Carbs !== undefined && <Stat label="Carbs" value={num(n.avg7Carbs)} unit="g" />}
            </div>
          </Card>
        )}
      </main>
    </>
  )
}

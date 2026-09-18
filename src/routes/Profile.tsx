import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router'
import { TopBar } from '@/components/ui/TopBar'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Inputs'
import { Spinner, Empty } from '@/components/ui/Empty'
import { Calendar, Chart, Dumbbell, Gear, Ruler } from '@/components/ui/Icons'
import { useWorkouts, useWorkoutCount } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { useNow } from '@/hooks/useNow'
import { useWeeklyStats, type StatMetric } from '@/hooks/useWeeklyStats'
import { formatDuration, formatLocalDate, toLocalDate } from '@/domain/dates'
import { toDisplay } from '@/domain/units'
import { formatVolume } from '@/lib/format'

const WeeklyBarChart = lazy(() => import('@/components/charts/WeeklyBarChart'))

export default function Profile() {
  const navigate = useNavigate()
  const settings = useSettings()
  const workouts = useWorkouts()
  const count = useWorkoutCount()
  const today = toLocalDate(useNow(60_000))
  const [metric, setMetric] = useState<StatMetric>('duration')
  const [weeks, setWeeks] = useState(13)
  const buckets = useWeeklyStats(workouts, weeks, settings.weekStartsOn, today)
  const thisWeek = buckets[buckets.length - 1]
  const unitLabel = settings.unit === 'kg' ? 'kg' : 'lbs'

  const value = (b: (typeof buckets)[number]) => (metric === 'duration' ? b.durationSec / 3600 : metric === 'volume' ? toDisplay(b.volumeLb, settings.unit) : b.reps)
  const fmt = (v: number) => (metric === 'duration' ? `${Math.round(v * 10) / 10} hrs` : metric === 'volume' ? `${Math.round(v / 1000)}k` : String(Math.round(v)))
  const headline = thisWeek
    ? metric === 'duration'
      ? formatDuration(thisWeek.durationSec)
      : metric === 'volume'
        ? formatVolume(thisWeek.volumeLb, settings.unit)
        : `${thisWeek.reps} reps`
    : ''

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar
        title="Profile"
        large
        right={
          <button type="button" aria-label="Settings" onClick={() => navigate('/settings')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Gear size={20} />
          </button>
        }
      />
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-2xl">🏛️</div>
        <div>
          <div className="text-xl font-semibold">Greek God Program 2.0</div>
          <div className="text-sm text-muted">
            <span className="text-white">{count}</span> workouts
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold">{headline}</span> <span className="text-muted">this week</span>
          </div>
          <Select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="h-9 w-auto px-2 text-sm text-accent">
            <option value={13}>Last 3 months</option>
            <option value={26}>Last 6 months</option>
            <option value={52}>Last year</option>
          </Select>
        </div>
        <Suspense fallback={<Spinner />}>
          <WeeklyBarChart data={buckets.map((b) => ({ label: b.label, value: value(b) }))} format={fmt} unitLabel={metric === 'volume' ? unitLabel : ''} />
        </Suspense>
        <Segmented
          className="mt-3"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'duration', label: 'Duration' },
            { value: 'volume', label: 'Volume' },
            { value: 'reps', label: 'Reps' },
          ]}
        />
      </Card>

      <h2 className="mb-2 text-lg font-semibold text-muted">Dashboard</h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Tile icon={<Chart />} label="Key Lifts" onClick={() => navigate('/key-lifts')} />
        <Tile icon={<Dumbbell />} label="Exercises" onClick={() => navigate('/exercises')} />
        <Tile icon={<Ruler />} label="Measures" onClick={() => navigate('/measures')} />
        <Tile icon={<Calendar />} label="Calendar" onClick={() => navigate('/history')} />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-muted">Workouts</h2>
      {!workouts ? (
        <Spinner />
      ) : workouts.length === 0 ? (
        <Empty title="No workouts yet">Your finished workouts show up here.</Empty>
      ) : (
        workouts.slice(0, 20).map((w) => (
          <button key={w.id} type="button" onClick={() => navigate(`/workouts/${w.id}`)} className="mb-3 block w-full rounded-2xl bg-surface p-4 text-left active:bg-surface-2">
            <div className="text-sm text-muted">{formatLocalDate(w.localDate, { weekday: true, year: true })}</div>
            <div className="text-lg font-semibold">{w.title}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted">Time</div>
                {formatDuration(w.durationSec)}
              </div>
              <div>
                <div className="text-xs text-muted">Volume</div>
                {formatVolume(w.volumeLb, settings.unit)}
              </div>
              <div>
                <div className="text-xs text-muted">Records</div>
                {w.prCount} 🏆
              </div>
            </div>
            <ul className="mt-2 text-sm text-muted">
              {w.exercises.slice(0, 4).map((e) => (
                <li key={e.id}>
                  {e.sets.filter((s) => s.completed && s.kind !== 'warmup').length} sets {e.nameSnapshot}
                </li>
              ))}
              {w.exercises.length > 4 && <li>…</li>}
            </ul>
          </button>
        ))
      )}
    </div>
  )
}

function Tile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-4 text-left font-semibold active:bg-surface-2">
      <span className="text-white">{icon}</span>
      {label}
    </button>
  )
}

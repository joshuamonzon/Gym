import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Workout } from '@/db/types'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Plus } from '@/components/ui/Icons'
import { Spinner } from '@/components/ui/Empty'
import { StreakHeader } from '@/components/calendar/StreakHeader'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { useWorkouts } from '@/hooks/useData'
import { useSettings } from '@/hooks/useSettings'
import { useNow } from '@/hooks/useNow'
import { createManualWorkout } from '@/db/repo/workouts'
import { addMonths, formatDuration, formatLocalDate, startOfMonth, toLocalDate } from '@/domain/dates'
import { restDays, weekStreak } from '@/domain/streaks'

export default function History() {
  const workouts = useWorkouts()
  const settings = useSettings()
  const now = useNow(60_000)
  const today = toLocalDate(now)
  const navigate = useNavigate()
  const [monthCount, setMonthCount] = useState(6)
  const [picked, setPicked] = useState<{ date: string; workouts: Workout[] } | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>()
    for (const w of workouts ?? []) {
      const list = map.get(w.localDate) ?? []
      list.push(w)
      map.set(w.localDate, list)
    }
    return map
  }, [workouts])
  const dates = useMemo(() => Array.from(byDate.keys()), [byDate])
  const months = useMemo(() => Array.from({ length: monthCount }, (_, i) => addMonths(startOfMonth(today), -i)), [monthCount, today])

  const logOn = async (date: string) => {
    const w = await createManualWorkout(date)
    setPicked(null)
    navigate(`/workouts/${w.id}/edit`)
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <TopBar title="History" large right={<Button size="sm" variant="secondary" onClick={() => void logOn(today)}><Plus size={16} /> Log</Button>} />
      {!workouts ? (
        <Spinner />
      ) : (
        <>
          <StreakHeader streak={weekStreak(dates, today, settings.weekStartsOn)} restDays={restDays(dates, today)} />
          {months.map((m) => (
            <MonthGrid key={m} month={m} workoutsByDate={byDate} weekStartsOn={settings.weekStartsOn} today={today} onPickDay={(date, list) => (list.length === 1 ? navigate(`/workouts/${list[0].id}`) : setPicked({ date, workouts: list }))} />
          ))}
          <Button variant="secondary" full onClick={() => setMonthCount((c) => c + 6)}>
            Show earlier months
          </Button>
        </>
      )}
      <Sheet open={picked !== null} onClose={() => setPicked(null)} title={picked ? formatLocalDate(picked.date, { weekday: true, year: true }) : ''}>
        {picked && (
          <div className="flex flex-col gap-2">
            {picked.workouts.map((w) => (
              <Button key={w.id} variant="secondary" full onClick={() => navigate(`/workouts/${w.id}`)}>
                {w.title} · {formatDuration(w.durationSec)}
              </Button>
            ))}
            {picked.date <= today && (
              <Button variant="ghost" full onClick={() => void logOn(picked.date)}>
                Log a workout on this day
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

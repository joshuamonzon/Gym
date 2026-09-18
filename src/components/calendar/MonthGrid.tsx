import type { Workout } from '@/db/types'
import { MONTH_LONG, WEEKDAY_SHORT, addDays, daysInMonth, parseLocalDate, weekday } from '@/domain/dates'

export interface MonthGridProps {
  month: string // 'YYYY-MM-01'
  workoutsByDate: Map<string, Workout[]>
  weekStartsOn: 0 | 1
  today: string
  onPickDay: (date: string, workouts: Workout[]) => void
}

function shortRoutineLabel(w: Workout): string {
  return (w.routineName ?? w.title).replace(/\s*\(MEGA\)/, '').slice(0, 14)
}

export function MonthGrid({ month, workoutsByDate, weekStartsOn, today, onPickDay }: MonthGridProps) {
  const d = parseLocalDate(month)
  const total = daysInMonth(month)
  const lead = (weekday(month) - weekStartsOn + 7) % 7
  const cells: (string | null)[] = [...Array<null>(lead).fill(null)]
  for (let i = 0; i < total; i += 1) cells.push(addDays(month, i))
  while (cells.length % 7 !== 0) cells.push(null)
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(weekStartsOn + i) % 7])
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-2xl font-bold">
        {MONTH_LONG[d.getMonth()]} {d.getFullYear()}
      </h2>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {headers.map((h) => (
          <div key={h} className="py-1">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const list = workoutsByDate.get(date) ?? []
          const trained = list.length > 0
          const isToday = date === today
          return (
            <button key={date} type="button" onClick={() => onPickDay(date, list)} className="flex flex-col items-center py-1">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] ${trained ? 'bg-accent font-semibold text-white' : isToday ? 'border border-accent text-accent' : ''}`}>
                {Number(date.slice(8))}
              </span>
              <span className="mt-0.5 h-3 w-full truncate px-0.5 text-center text-[9px] leading-3 text-muted">{trained ? shortRoutineLabel(list[0]) : ''}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

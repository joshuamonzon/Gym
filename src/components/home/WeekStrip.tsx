import type { WeekDay } from '@/domain/scheduler'
import { WEEKDAY_SHORT } from '@/domain/dates'

export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-1 rounded-2xl bg-surface p-2">
      {days.map((d) => {
        const num = Number(d.date.slice(8))
        const circle =
          d.status === 'done'
            ? 'bg-accent text-white'
            : d.status === 'planned'
              ? 'border border-accent text-accent'
              : d.status === 'missed'
                ? 'border border-border text-muted line-through'
                : 'text-muted'
        return (
          <div key={d.date} className="flex flex-col items-center gap-1 py-1">
            <span className={`text-[11px] font-semibold ${d.isToday ? 'text-white' : 'text-muted'}`}>{WEEKDAY_SHORT[d.weekday][0]}</span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${circle} ${d.isToday && d.status !== 'done' ? 'ring-2 ring-white/60' : ''}`}>{num}</span>
            <span className="h-3 w-full truncate text-center text-[9px] leading-3 text-muted">{d.label ?? (d.status === 'missed' ? 'missed' : '')}</span>
          </div>
        )
      })}
    </div>
  )
}

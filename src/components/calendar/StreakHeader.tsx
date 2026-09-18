import { Flame, Moon } from '@/components/ui/Icons'

export function StreakHeader({ streak, restDays }: { streak: number; restDays: number }) {
  return (
    <div className="mb-4 grid grid-cols-2 divide-x divide-border rounded-2xl bg-surface">
      <div className="flex items-center justify-center gap-2 py-3">
        <Flame className="text-orange-500" size={20} />
        <span className="font-semibold">
          {streak} week{streak === 1 ? '' : 's'} streak
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 py-3">
        <Moon className="text-accent" size={18} />
        <span className="font-semibold">
          {restDays} rest day{restDays === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}

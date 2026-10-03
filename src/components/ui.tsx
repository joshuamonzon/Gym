import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-surface border border-border ${className}`}>{children}</section>
}

/** Label over a big tabular number. */
export function Stat({
  label,
  value,
  sub,
  size = 'lg',
  tone,
}: {
  label: string
  value: string
  sub?: ReactNode
  size?: 'lg' | 'md' | 'sm'
  tone?: 'up' | 'down'
}) {
  const sizeCls = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base'
  const toneCls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : ''
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted truncate">{label}</div>
      <div className={`${sizeCls} font-semibold leading-tight tabular-nums ${toneCls}`}>{value}</div>
      {sub !== undefined && <div className="text-xs text-muted tabular-nums mt-0.5">{sub}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg bg-surface-2 p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md min-w-11 ${
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="pt-safe sticky top-0 z-10 bg-bg/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 h-12">
        <h1 className="text-lg font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted text-center py-10">{children}</p>
}

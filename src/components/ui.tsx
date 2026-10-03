import type { ReactNode } from 'react'
import { toneCls } from '../lib/tone'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-surface border border-border ${className}`}>{children}</section>
}

/** One big number with a small label under it. The unit rides along in `unit`. */
export function Hero({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string
  value: string
  unit?: string
  sub?: ReactNode
  tone?: 'up' | 'down'
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 flex items-baseline gap-1.5 ${toneCls(tone)}`}>
        <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-lg text-muted">{unit}</span>}
      </div>
      {sub !== undefined && <div className="mt-2 text-sm text-muted tabular-nums">{sub}</div>}
    </div>
  )
}

/** Smaller stat for a row of 2–3. */
export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string
  value: string
  unit?: string
  sub?: ReactNode
  tone?: 'up' | 'down'
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted truncate">{label}</div>
      <div className={`mt-0.5 flex items-baseline gap-1 ${toneCls(tone)}`}>
        <span className="text-2xl font-semibold leading-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {sub !== undefined && <div className="text-xs text-muted tabular-nums mt-0.5">{sub}</div>}
    </div>
  )
}

/** Key on the left, value on the right. For lists of facts. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-t border-border/60 first:border-t-0">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <span className="text-sm text-right tabular-nums">{children}</span>
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
      <div className="flex items-center justify-between px-5 h-14">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted text-center py-10">{children}</p>
}

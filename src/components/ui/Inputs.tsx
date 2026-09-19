import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

export interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null
  onCommit: (v: number | null) => void
  decimals?: number
}

/** Locally-controlled numeric input that commits on blur/Enter, so live queries never fight typing. */
export function NumberField({ value, onCommit, decimals = 2, className = '', ...rest }: NumberFieldProps) {
  const fmt = (v: number | null) => (v === null || Number.isNaN(v) ? '' : String(Math.round(v * 10 ** decimals) / 10 ** decimals))
  const [text, setText] = useState(fmt(value))
  const [focused, setFocused] = useState(false)
  const [synced, setSynced] = useState(value)
  if (!focused && value !== synced) {
    setSynced(value)
    setText(fmt(value))
  }
  const commit = () => {
    const t = text.trim().replace(',', '.')
    if (t === '') {
      if (value !== null) onCommit(null)
      return
    }
    const n = Number(t)
    if (Number.isFinite(n) && n !== value) onCommit(n)
    else if (!Number.isFinite(n)) setText(fmt(value))
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => {
        setFocused(true)
        e.target.select()
      }}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className={`h-11 w-full rounded-xl border border-border bg-bg px-2 text-center text-[16px] font-semibold text-white outline-none placeholder:text-muted/60 focus:border-accent ${className}`}
      {...rest}
    />
  )
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full rounded-xl border border-border bg-bg px-3 text-[16px] text-white outline-none placeholder:text-muted/60 focus:border-accent ${className}`}
      {...rest}
    />
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Select({ className = '', ...rest }: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={`h-11 w-full appearance-none rounded-xl border border-border bg-bg px-3 text-[16px] text-white outline-none focus:border-accent ${className}`}
      {...rest}
    />
  )
}

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({ options, value, onChange, className = '' }: { options: SegmentedOption<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${o.value === value ? 'bg-accent text-white' : 'bg-surface text-white active:bg-surface-2'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

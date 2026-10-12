/** Round check circle. Fills green when checked. */
export function Check({ checked, onToggle, label = 'Mark done' }: { checked: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="check"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 7.5l3 3 6-7" />
      </svg>
    </button>
  )
}

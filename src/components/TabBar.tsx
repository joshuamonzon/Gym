import { TABS, type Tab } from '../lib/tabs'

const META: Record<Tab, { label: string; icon: string }> = {
  // Stroke paths, 24×24 viewBox.
  today: { label: 'Today', icon: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM3 10h18M8 3v4M16 3v4' },
  week: { label: 'Week', icon: 'M4 19V9M10 19V5M16 19v-8M22 19H2' },
  lifts: { label: 'Lifts', icon: 'M2 12h3M19 12h3M5 8v8M19 8v8M8 6v12M16 6v12M8 12h8' },
}

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabs" aria-label="Screens">
      <ul role="tablist">
        {TABS.map((id) => {
          const m = META[id]
          const active = id === tab
          return (
            <li key={id}>
              <button type="button" role="tab" aria-selected={active} aria-controls={`s-${id}`} className="tab" onClick={() => onChange(id)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={m.icon} />
                </svg>
                {m.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

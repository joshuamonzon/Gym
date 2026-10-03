export type Tab = 'now' | 'weeks' | 'charts' | 'log'

const TABS: { id: Tab; label: string; icon: string }[] = [
  // Simple stroke paths, 24×24 viewBox.
  { id: 'now', label: 'Today', icon: 'M12 3v2M12 19v2M3 12h2M19 12h2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { id: 'weeks', label: 'Weeks', icon: 'M4 5h16v4H4zM4 10h16v4H4zM4 15h16v4H4z' },
  { id: 'charts', label: 'Charts', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'log', label: 'Log', icon: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h4' },
]

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Screens"
      className="fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur border-t border-border pb-safe"
    >
      <ul className="mx-auto max-w-xl grid grid-cols-4 h-14">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <li key={t.id}>
              <button
                onClick={() => onChange(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? 'text-fg' : 'text-muted'
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={t.icon} />
                </svg>
                {t.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

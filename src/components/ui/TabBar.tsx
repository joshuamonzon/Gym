import { NavLink } from 'react-router'

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/workout', label: 'Workout', icon: DumbbellIcon, end: false },
  { to: '/history', label: 'History', icon: CalendarIcon, end: false },
  { to: '/profile', label: 'Profile', icon: PersonIcon, end: false },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-black/90 pb-safe backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <t.icon />
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
function DumbbellIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2M20 12h2M9 12h6" />
      <rect x="4" y="8" width="3" height="8" rx="1" />
      <rect x="17" y="8" width="3" height="8" rx="1" />
      <rect x="7" y="6" width="2" height="12" rx="0.5" />
      <rect x="15" y="6" width="2" height="12" rx="0.5" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

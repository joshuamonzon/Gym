import { useCallback, useState } from 'react'
import { TabBar } from './components/TabBar'
import { TABS, type Tab } from './lib/tabs'
import { config, days } from './lib/data'
import { addDays, daysBetween, todayLocal } from './lib/dates'
import { useTheme } from './lib/theme'
import { Today } from './screens/Today'
import { Week } from './screens/Week'
import { Lifts } from './screens/Lifts'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Mon, Oct 12" */
function headerDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return `${DOW[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

function initialTab(): Tab {
  try {
    const h = location.hash.slice(1)
    if ((TABS as string[]).includes(h)) return h as Tab
  } catch {
    /* no location */
  }
  return 'today'
}

/** "Shift" today, "Off shift" the morning after one, "Off" on a logged off day; nothing when unknown. */
function shiftChip(today: string): { text: string; cls: string } | undefined {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const t = byDate.get(today)?.shift
  if (t === true) return { text: 'Shift', cls: ' shift' }
  if (byDate.get(addDays(today, -1))?.shift === true) return { text: 'Off shift', cls: ' offshift' }
  if (t === false) return { text: 'Off', cls: '' }
  return undefined
}

export default function App() {
  const today = todayLocal()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [theme, toggleTheme] = useTheme()
  const go = useCallback((t: Tab) => {
    setTab(t)
    try {
      history.replaceState(null, '', `#${t}`)
      window.scrollTo({ top: 0 })
    } catch {
      /* ignore */
    }
  }, [])

  const shift = shiftChip(today)
  const shiftTomorrow = days.find((d) => d.date === addDays(today, 1))?.shift === true
  const { start, end } = config.challenge
  const length = daysBetween(start, end) + 1
  const challengeDay = today >= start && today <= end ? daysBetween(start, today) + 1 : undefined

  return (
    <div className="shell">
      <header className="hdr">
        <div>
          <div className="date">{headerDate(today)}</div>
          <div className="sub">
            {shift && <span className={`chip${shift.cls}`}>{shift.text}</span>}
            {challengeDay !== undefined && (
              <span className="chip">
                Day {challengeDay} of {length}
              </span>
            )}
            {shiftTomorrow && <span className="chip">Shift tomorrow</span>}
          </div>
        </div>
        <button type="button" className="theme" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
          {theme === 'dark' ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8" cy="8" r="3.2" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 9.8A5.5 5.5 0 0 1 6.2 2.5a5.5 5.5 0 1 0 7.3 7.3z" />
            </svg>
          )}
        </button>
      </header>

      <main className="screen" id={`s-${tab}`} role="tabpanel">
        {tab === 'today' && <Today today={today} onGo={go} />}
        {tab === 'week' && <Week today={today} />}
        {tab === 'lifts' && <Lifts today={today} />}
      </main>

      <TabBar tab={tab} onChange={go} />
    </div>
  )
}

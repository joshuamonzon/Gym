import { Suspense, lazy, useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { Now } from './screens/Now'
import { Weeks } from './screens/Weeks'
const Charts = lazy(() => import('./screens/Charts').then((m) => ({ default: m.Charts })))
import { Log } from './screens/Log'

export default function App() {
  const [tab, setTab] = useState<Tab>('now')
  return (
    <div className="mx-auto max-w-xl min-h-dvh pb-tabbar">
      {tab === 'now' && <Now />}
      {tab === 'weeks' && <Weeks />}
      {tab === 'charts' && (
        <Suspense fallback={<div className="pt-safe px-4 h-12 flex items-center text-lg font-semibold">Charts</div>}>
          <Charts />
        </Suspense>
      )}
      {tab === 'log' && <Log />}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}

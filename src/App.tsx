import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { TabBar } from './components/ui/TabBar'
import { Toast } from './components/ui/Toast'
import { MinimizedWorkoutBar } from './components/workout/MinimizedWorkoutBar'
import { useActiveWorkout } from './hooks/useActiveWorkout'
import { useUiStore } from './store/uiStore'

function UpdatePrompt() {
  const active = useActiveWorkout()
  const updateAvailable = useUiStore((s) => s.updateAvailable)
  const applyUpdate = useUiStore((s) => s.applyUpdate)
  const showToast = useUiStore((s) => s.showToast)
  useEffect(() => {
    if (updateAvailable && applyUpdate && active === undefined) {
      showToast('A new version is ready.', { label: 'Reload', onAction: applyUpdate })
    }
  }, [updateAvailable, applyUpdate, active, showToast])
  return null
}

export default function App() {
  const location = useLocation()
  const fullScreen = location.pathname.startsWith('/workout/active')
  return (
    <div className="min-h-dvh bg-bg text-white">
      <main className={fullScreen ? '' : 'pb-28'}>
        <Outlet />
      </main>
      {!fullScreen && <MinimizedWorkoutBar />}
      {!fullScreen && <TabBar />}
      <Toast />
      <UpdatePrompt />
    </div>
  )
}

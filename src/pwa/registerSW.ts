import { registerSW } from 'virtual:pwa-register'
import { useUiStore } from '@/store/uiStore'

export function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      useUiStore.getState().setUpdateAvailable(() => void update(true))
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })
}

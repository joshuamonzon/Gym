import { useEffect, useState } from 'react'

/** Current time that ticks only while the page is visible; snaps on return. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    let timer: number | undefined
    const start = () => {
      stop()
      setNow(Date.now())
      timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    }
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
    }
    const onVis = () => (document.visibilityState === 'visible' ? start() : stop())
    start()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pageshow', start)
    window.addEventListener('focus', start)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pageshow', start)
      window.removeEventListener('focus', start)
    }
  }, [intervalMs, enabled])
  return now
}

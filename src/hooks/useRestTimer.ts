import { useEffect, useRef } from 'react'
import type { RestTimerState } from '@/db/types'
import { markRestFired, skipRest } from '@/db/repo/activeWorkout'
import { beep } from '@/lib/audio'
import { vibrate } from '@/lib/haptics'
import { useNow } from './useNow'

export interface RestTimerView {
  active: boolean
  remainingSec: number
  durationSec: number
  progress: number
  finished: boolean
}

const CLEAR_AFTER_MS = 2500

/** Countdown derived from stored timestamps; fires once, even after backgrounding. */
export function useRestTimer(restTimer: RestTimerState | null | undefined, sound: boolean): RestTimerView {
  const now = useNow(250, Boolean(restTimer))
  const firedFor = useRef<string | null>(null)
  const remainingMs = restTimer ? restTimer.endsAt - now : 0
  const finished = Boolean(restTimer) && remainingMs <= 0
  const key = restTimer ? `${restTimer.setId}:${restTimer.endsAt}` : null

  useEffect(() => {
    if (!restTimer || !finished) return
    if (!restTimer.fired && firedFor.current !== key) {
      firedFor.current = key
      if (sound) beep('end')
      vibrate([200, 100, 200, 100, 400])
      void markRestFired()
    }
    const t = window.setTimeout(() => void skipRest(), CLEAR_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [restTimer, finished, key, sound])

  return {
    active: Boolean(restTimer),
    remainingSec: Math.max(0, Math.ceil(remainingMs / 1000)),
    durationSec: restTimer?.durationSec ?? 0,
    progress: restTimer && restTimer.durationSec > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / (restTimer.durationSec * 1000))) : 0,
    finished,
  }
}

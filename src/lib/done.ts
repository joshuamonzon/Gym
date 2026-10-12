import { useCallback, useState } from 'react'
import { readJson, writeJson } from './storage'

/**
 * Done-state for a day's plan (working sets, the cardio card, mobility),
 * persisted per day in localStorage only — never written to the day file.
 * Keys: `${exercise}:${setIndex}` for sets, `cardio` / `mobility` for cards.
 */
export function useDone(date: string): [Set<string>, (key: string) => void] {
  const storageKey = `training:plan-done:${date}`
  const [done, setDone] = useState<Set<string>>(() => new Set(readJson<string[]>(storageKey, [])))
  const toggle = useCallback(
    (key: string) => {
      setDone((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        writeJson(storageKey, [...next])
        return next
      })
    },
    [storageKey],
  )
  return [done, toggle]
}

export function setKey(exercise: string, index: number): string {
  return `${exercise}:${index}`
}

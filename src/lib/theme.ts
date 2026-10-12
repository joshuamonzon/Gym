import { useCallback, useEffect, useState } from 'react'
import { readString, writeString } from './storage'

export type Theme = 'dark' | 'light'
const KEY = 'tn-theme'

function osTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Current theme, honouring a pinned choice in localStorage over the OS. */
export function useTheme(): [Theme, () => void] {
  const [pinned, setPinned] = useState<Theme | undefined>(() => {
    const t = readString(KEY)
    return t === 'light' || t === 'dark' ? t : undefined
  })
  const theme = pinned ?? osTheme()
  useEffect(() => {
    const root = document.documentElement
    if (pinned) root.setAttribute('data-theme', pinned)
    else root.removeAttribute('data-theme')
  }, [pinned])
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setPinned(next)
    writeString(KEY, next)
  }, [theme])
  return [theme, toggle]
}

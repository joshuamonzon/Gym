import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { defaultSettings } from '@/db/seed'
import type { Settings } from '@/db/types'

const FALLBACK = defaultSettings(0)

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get('app'), [])
  return s ?? FALLBACK
}

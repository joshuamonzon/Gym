import { db } from '../db'
import { defaultSettings } from '../seed'
import type { Settings } from '../types'

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const current = await db.settings.get('app')
    if (!current) {
      await db.settings.add({ ...defaultSettings(), ...patch })
    } else {
      await db.settings.put({ ...current, ...patch })
    }
  })
}

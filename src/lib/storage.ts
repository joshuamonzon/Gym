export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone) || window.matchMedia?.('(display-mode: standalone)').matches
}

/** Sign-aware colour for a delta where `goodWhen` says which direction is good. */
export function deltaTone(delta: number | undefined, goodWhen: 'down' | 'up'): 'up' | 'down' | undefined {
  if (delta === undefined || Math.abs(delta) < 1e-9) return undefined
  const improved = goodWhen === 'down' ? delta < 0 : delta > 0
  return improved ? 'up' : 'down'
}

/** Tailwind class for a tone. */
export function toneCls(t: 'up' | 'down' | undefined): string {
  return t === 'up' ? 'text-up' : t === 'down' ? 'text-down' : ''
}

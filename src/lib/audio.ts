type AudioSessionNav = Navigator & { audioSession?: { type: string } }

let ctx: AudioContext | null = null
let unlocked = false

/** Must be called from a user gesture; primes the audio context so later beeps play. */
export function unlockAudio(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    const nav = navigator as AudioSessionNav
    if (nav.audioSession) nav.audioSession.type = 'playback'
    if (ctx.state === 'suspended') void ctx.resume()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start(0)
    unlocked = true
  } catch {
    /* audio is best-effort */
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked
}

function tone(at: number, freq: number, dur: number, gain = 0.25) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

/** Three rising beeps for "rest over"; a short blip for warnings. */
export function beep(kind: 'end' | 'blip' = 'end'): void {
  try {
    if (!ctx) unlockAudio()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    if (kind === 'blip') {
      tone(t, 880, 0.12)
      return
    }
    tone(t, 880, 0.15)
    tone(t + 0.2, 1100, 0.15)
    tone(t + 0.4, 1320, 0.3)
  } catch {
    /* ignore */
  }
}

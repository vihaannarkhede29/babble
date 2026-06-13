// sounds.ts — Tiny Web Audio "ding" cues for correct sounds and word wins.
//
// Ported from the partner shell. Pure Web Audio (no assets, no deps): two short
// sine arpeggios synthesised on the fly. A single shared AudioContext is reused
// and resumed lazily on the first user gesture (browsers start it suspended).

let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedContext) {
    try {
      sharedContext = new AudioContext()
    } catch {
      return null
    }
  }
  return sharedContext
}

async function ensureAudioReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext()
  if (!ctx) return null
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return null
    }
  }
  return ctx
}

/** Warm up / resume the audio context — call once on a user gesture. */
export async function prepareAudio(): Promise<void> {
  await ensureAudioReady()
}

/** A bright two-note "correct!" chime. */
export async function playCorrectDing(): Promise<void> {
  const ctx = await ensureAudioReady()
  if (!ctx) return
  const now = ctx.currentTime

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.015)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  master.connect(ctx.destination)

  const tone = (frequency: number, start: number, duration: number, volume: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, start)
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.12, start + duration * 0.35)
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  tone(784, now, 0.22, 0.7)
  tone(1175, now + 0.04, 0.2, 0.35)
}

/** A rising three-note "you said the whole word!" fanfare. */
export async function playWordSuccessDing(): Promise<void> {
  const ctx = await ensureAudioReady()
  if (!ctx) return
  const now = ctx.currentTime

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.24, now + 0.02)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
  master.connect(ctx.destination)

  const tone = (frequency: number, start: number, duration: number, volume: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  tone(659, now, 0.18, 0.55)
  tone(880, now + 0.1, 0.18, 0.6)
  tone(1175, now + 0.2, 0.28, 0.65)
}

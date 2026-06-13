let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!sharedContext) {
    sharedContext = new AudioContext()
  }

  return sharedContext
}

async function ensureAudioReady() {
  const ctx = getAudioContext()
  if (!ctx) return null
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}

export async function prepareAudio() {
  await ensureAudioReady()
}

export async function playCorrectDing() {
  const ctx = await ensureAudioReady()
  if (!ctx) return

  const now = ctx.currentTime

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.015)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  master.connect(ctx.destination)

  const playTone = (frequency: number, start: number, duration: number, volume: number) => {
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

  playTone(784, now, 0.22, 0.7)
  playTone(1175, now + 0.04, 0.2, 0.35)
}

export async function playWordSuccessDing() {
  const ctx = await ensureAudioReady()
  if (!ctx) return

  const now = ctx.currentTime

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.24, now + 0.02)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
  master.connect(ctx.destination)

  const playTone = (frequency: number, start: number, duration: number, volume: number) => {
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

  playTone(659, now, 0.18, 0.55)
  playTone(880, now + 0.1, 0.18, 0.6)
  playTone(1175, now + 0.2, 0.28, 0.65)
}

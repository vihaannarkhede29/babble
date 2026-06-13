// capture.ts — Where the samples come from.
//
// Two interchangeable sources implement the same `FrameProvider` interface so
// the rest of the app never cares which is active:
//
//   • MicFrameProvider  — the real microphone via the Web Audio API.
//   • SynthFrameProvider — a source–filter speech synthesizer used when there
//     is no mic / permission is declined. It generates a genuine vowel waveform
//     with the target formants, so the SAME dsp.ts pipeline analyses it for
//     real. This is what makes the demo bullet-proof on any laptop.

import type { Phoneme } from '../lib/types'

/** The analysis window size both providers hand back. */
export const FRAME_SIZE = 2048

export interface FrameProvider {
  readonly sampleRate: number
  /** Latest window of mono samples (length FRAME_SIZE), values ~[-1, 1]. */
  read(): Float32Array
  stop(): void
}

// ---------------------------------------------------------------------------
// Microphone
// ---------------------------------------------------------------------------

export class MicFrameProvider implements FrameProvider {
  readonly sampleRate: number
  private ctx: AudioContext
  private stream: MediaStream
  private analyser: AnalyserNode
  // Explicit ArrayBuffer backing: the Web Audio typings (TS 5.7+) require it.
  private buffer: Float32Array<ArrayBuffer>

  private constructor(ctx: AudioContext, stream: MediaStream, analyser: AnalyserNode) {
    this.ctx = ctx
    this.stream = stream
    this.analyser = analyser
    this.sampleRate = ctx.sampleRate
    this.buffer = new Float32Array(analyser.fftSize)
  }

  /** Request the mic and wire up the graph. Throws if unavailable/denied. */
  static async create(): Promise<MicFrameProvider> {
    // Disable the browser's voice processing — it smears the formants we need.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FRAME_SIZE
    source.connect(analyser)
    return new MicFrameProvider(ctx, stream, analyser)
  }

  read(): Float32Array {
    this.analyser.getFloatTimeDomainData(this.buffer)
    return this.buffer
  }

  stop(): void {
    this.stream.getTracks().forEach((t) => t.stop())
    void this.ctx.close()
  }
}

// ---------------------------------------------------------------------------
// Synthetic voice (source–filter model)
// ---------------------------------------------------------------------------

/** A 2nd-order resonator: a single formant peak. */
class Resonator {
  private y1 = 0
  private y2 = 0
  private a1 = 0
  private a2 = 0
  set(freq: number, bandwidth: number, fs: number) {
    const r = Math.exp((-Math.PI * bandwidth) / fs)
    this.a1 = 2 * r * Math.cos((2 * Math.PI * freq) / fs)
    this.a2 = -r * r
  }
  step(x: number): number {
    const y = x + this.a1 * this.y1 + this.a2 * this.y2
    this.y2 = this.y1
    this.y1 = y
    return y
  }
}

/**
 * Generates speech-like frames with controllable formants. The UI tells it
 * which phoneme to "say" and how well (`quality` 0..1); we interpolate from a
 * neutral schwa toward the true target so the on-screen score rises naturally.
 */
export class SynthFrameProvider implements FrameProvider {
  readonly sampleRate = 16000
  private r1 = new Resonator()
  private r2 = new Resonator()
  private bp = new Resonator()
  private phase = 0
  private f0 = 230 // child-ish fundamental
  private mode: 'formant' | 'sibilant' = 'formant'
  private synthF1 = 500
  private synthF2 = 1500
  private synthCentroid = 4000
  private amp = 0 // 0 when "not speaking"

  /** Aim the synth at a phoneme at the given quality (1 = perfect). */
  speak(p: Phoneme, quality: number): void {
    this.amp = 0.22
    this.mode = p.mode
    const q = clamp01(quality)
    if (p.mode === 'formant') {
      // Neutral schwa as the "still learning" starting point.
      this.synthF1 = lerp(500, p.f1, q) + jitter(15)
      this.synthF2 = lerp(1500, p.f2, q) + jitter(40)
    } else {
      this.synthCentroid = lerp(2200, p.centroidTarget ?? 5000, q) + jitter(150)
    }
  }

  /** Stop producing sound (button released). */
  silence(): void {
    this.amp = 0
  }

  read(): Float32Array {
    const out = new Float32Array(FRAME_SIZE)
    if (this.amp <= 0) return out // silence window

    const fs = this.sampleRate
    if (this.mode === 'formant') {
      this.r1.set(this.synthF1, 90, fs)
      this.r2.set(this.synthF2, 110, fs)
      const period = fs / this.f0
      for (let i = 0; i < FRAME_SIZE; i++) {
        // Glottal source: a sparse impulse train.
        this.phase += 1
        let exc = 0
        if (this.phase >= period) {
          this.phase -= period
          exc = 1
        }
        out[i] = this.amp * (this.r1.step(exc) + 0.6 * this.r2.step(exc))
      }
    } else {
      // Sibilant: band-passed noise centred on the target brightness.
      this.bp.set(this.synthCentroid, 1200, fs)
      for (let i = 0; i < FRAME_SIZE; i++) {
        const noise = Math.random() * 2 - 1
        out[i] = this.amp * 1.5 * this.bp.step(noise)
      }
    }
    return out
  }

  stop(): void {
    this.amp = 0
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
function jitter(amount: number): number {
  return (Math.random() * 2 - 1) * amount
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

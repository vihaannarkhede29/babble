// WaveCanvas.tsx — The "interference sync wave": the revamped cool graph.
//
// Two waves on a canvas:
//   • TARGET  — a smooth reference sine (where we want the voice to lock).
//   • CHILD   — driven LIVE from the microphone's real FFT (dominant frequency →
//               wave frequency, loudness → amplitude). This is genuine on-device
//               DSP (AnalyserNode → frequency bins), used here for the VISUAL.
//
// As you speak the child wave dances; on a correct word it snaps into phase with
// the target and both glow green. (The grade itself comes from speech
// recognition — the wave is the feedback, not the judge.)

import { useEffect, useRef } from 'react'

export type WaveStatus = 'idle' | 'listening' | 'success' | 'error'

interface Props {
  analyser: AnalyserNode | null
  status: WaveStatus
}

export function WaveCanvas({ analyser, status }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const freqBuf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const sampleRate = analyser?.context.sampleRate ?? 48000

    let raf = 0
    let phase = 0
    let childFreq = 3 // smoothed visual cycles across the canvas
    let childAmp = 0 // smoothed 0..1

    const TARGET_FREQ = 3
    const TARGET_AMP = 0.32

    const sine = (freq: number, amp: number, ph: number, color: string, width: number, glow: number) => {
      ctx.beginPath()
      ctx.lineWidth = width
      ctx.strokeStyle = color
      ctx.shadowBlur = glow
      ctx.shadowColor = color
      for (let x = 0; x <= W; x++) {
        const y = H / 2 + amp * (H / 2 - 6) * Math.sin(freq * (x / W) * 2 * Math.PI + ph)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      phase += 0.06
      const s = statusRef.current

      // Extract the child's live frequency/amplitude from real FFT data.
      if (s === 'listening' && analyser && freqBuf) {
        analyser.getByteFrequencyData(freqBuf)
        let peak = 0
        let peakVal = 0
        let sum = 0
        for (let i = 1; i < freqBuf.length; i++) {
          sum += freqBuf[i]
          if (freqBuf[i] > peakVal) {
            peakVal = freqBuf[i]
            peak = i
          }
        }
        const dominantHz = (peak * (sampleRate / 2)) / freqBuf.length
        // Map pitch (≈80–900 Hz speech) onto 1.5–8 visible cycles.
        const targetCycles = 1.5 + Math.min(1, dominantHz / 900) * 6.5
        const loud = Math.min(1, (sum / freqBuf.length) / 80)
        childFreq += (targetCycles - childFreq) * 0.2
        childAmp += (loud * 0.45 - childAmp) * 0.25
      } else if (s === 'success') {
        // Lock onto the target.
        childFreq += (TARGET_FREQ - childFreq) * 0.2
        childAmp += (TARGET_AMP - childAmp) * 0.2
      } else if (s === 'error') {
        childFreq += (TARGET_FREQ * 1.8 - childFreq) * 0.2
        childAmp += (0.36 - childAmp) * 0.2
      } else {
        childAmp += (0 - childAmp) * 0.1
      }

      const locked = s === 'success'
      const childColor = locked ? '#4ade80' : s === 'error' ? '#EF6C57' : '#3BBFBF'
      // Target wave (faint) — hidden once locked so the single green wave pops.
      sine(TARGET_FREQ, TARGET_AMP, phase, locked ? '#4ade80' : '#9BB0A5', locked ? 4 : 2.5, locked ? 12 : 0)
      // Child wave.
      const childPhase = locked ? phase : phase * (childFreq / TARGET_FREQ)
      sine(childFreq, childAmp, childPhase, childColor, 3.5, locked ? 12 : s === 'listening' ? 8 : 0)

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [analyser])

  return (
    <canvas ref={canvasRef} width={320} height={92} className="wave-canvas" aria-hidden="true" />
  )
}

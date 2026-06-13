// useMicVolume.ts — A tiny live microphone-loudness meter (0..1).
//
// Purely cosmetic but high-impact: it drives a pulsing ring on the mic button so
// the moment you speak, the UI reacts — the app feels alive and tells the child
// "I can hear you." It runs an AnalyserNode on its own mic stream, independent of
// the SpeechRecognition engine.

import { useEffect, useRef, useState } from 'react'
import { rms } from '../audio/dsp'

/** Returns a smoothed 0..1 loudness while `active`, else 0. */
export function useMicVolume(active: boolean): number {
  const [level, setLevel] = useState(0)
  const smoothRef = useRef(0)

  useEffect(() => {
    if (!active) {
      smoothRef.current = 0
      setLevel(0)
      return
    }
    // getUserMedia is undefined on insecure origins (non-localhost http) and in
    // browsers without it. Skip silently — the ring just won't animate; never crash.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return
    }
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let raf = 0
    let cancelled = false

    const buffer = new Float32Array(1024)

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        ctx = new AudioContext()
        const src = ctx.createMediaStreamSource(s)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        src.connect(analyser)
        const tick = () => {
          analyser.getFloatTimeDomainData(buffer)
          // Map RMS into a punchy 0..1 range (typical speech RMS is ~0.05–0.2).
          const target = Math.min(1, rms(buffer) * 6)
          smoothRef.current = smoothRef.current * 0.7 + target * 0.3
          setLevel(smoothRef.current)
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      })
      .catch(() => {
        // No mic / denied — the ring just stays still; not fatal.
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      void ctx?.close()
    }
  }, [active])

  return level
}

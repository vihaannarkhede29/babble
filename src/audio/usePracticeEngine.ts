// usePracticeEngine.ts — The real-time loop, packaged as a React hook.
//
// Responsibilities:
//   1. Acquire an audio source (mic, or the synth fallback) on a user gesture.
//   2. Every animation frame: read a window → analyzeFrame → scoreFrame.
//   3. Implement "hold to speak" with NOISE-ROBUST scoring (see below) and, on
//      release, persist a real attempt — or, if nothing was actually said, tell
//      the child instead of rewarding silence.
//
// Why this is more than "track the max score":
//   • An adaptive noise floor is learned from the room while idle, so the energy
//     gate adapts to how loud the background is.
//   • A frame only counts when it is genuinely VOICED (periodic) — aperiodic
//     room noise is rejected by dsp.ts's periodicity measure and the scorer.
//   • The attempt score comes from a SUSTAINED run of voiced frames (a smoothed
//     value that needs several consecutive good frames), not the single luckiest
//     frame. A fluke from noise can't "lock in" a win.
//   • If too few voiced frames occurred, no attempt is recorded and no XP given.
//
// Mutable loop state lives in refs (so the rAF callback always sees fresh
// values); a throttled mirror into React state drives the live visuals.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AcousticFrame, Phoneme, ScoreResult } from '../lib/types'
import { analyzeFrame } from './dsp'
import { scoreFrame } from './scorer'
import { MicFrameProvider, SynthFrameProvider, type FrameProvider } from './capture'

type Status = 'idle' | 'starting' | 'ready' | 'error'

/** Max length of a single hold before we auto-release (ms). */
const MAX_HOLD_MS = 2600
/** In demo mode, how long the synth takes to "find" the sound (ms). */
const DEMO_RAMP_MS = 1300
/** A frame's RMS must exceed this many × the learned room noise floor to count. */
const NOISE_MARGIN = 2.5
/** Absolute floor so a dead-silent room can't make the margin trivially small. */
const ABS_ENERGY_FLOOR = 0.02
/** Consecutive voiced frames required before the score can climb (debounce). */
const MIN_VOICED_RUN = 4
/** Total voiced frames a hold needs before it counts as a real attempt (~0.2s). */
const MIN_VOICED_FRAMES = 12

export interface PracticeEngine {
  status: Status
  isMic: boolean
  error: string | null
  /** Latest live values for the visuals. */
  frame: AcousticFrame | null
  score: ScoreResult | null
  /** Smoothed accuracy 0..1 for the meter. */
  level: number
  isHolding: boolean
  /** True only when the current frame is genuinely voiced on-target (for visuals). */
  active: boolean
  start: () => Promise<void>
  press: () => void
  release: () => void
}

export function usePracticeEngine(
  target: Phoneme,
  onAttempt: (score: number) => void,
  /** Called instead of onAttempt when a hold contained no real speech. */
  onNoSound?: () => void,
): PracticeEngine {
  const [status, setStatus] = useState<Status>('idle')
  const [isMic, setIsMic] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frame, setFrame] = useState<AcousticFrame | null>(null)
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [level, setLevel] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [active, setActive] = useState(false)

  // --- loop refs (never trigger re-renders) ---
  const providerRef = useRef<FrameProvider | null>(null)
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef(target)
  const holdingRef = useRef(false)
  const holdStartRef = useRef(0)
  const bestRef = useRef(0) // best sustained accuracy this hold (0..1)
  const sustainedRef = useRef(0) // smoothed accuracy over voiced frames
  const voicedRunRef = useRef(0) // consecutive voiced frames right now
  const voicedFramesRef = useRef(0) // total voiced frames this hold
  const noiseFloorRef = useRef(ABS_ENERGY_FLOOR) // learned ambient RMS
  const onAttemptRef = useRef(onAttempt)
  const onNoSoundRef = useRef(onNoSound)

  // Keep refs in sync with the latest props each render.
  targetRef.current = target
  onAttemptRef.current = onAttempt
  onNoSoundRef.current = onNoSound

  const start = useCallback(async () => {
    if (status === 'ready' || status === 'starting') return
    setStatus('starting')
    setError(null)
    try {
      providerRef.current = await MicFrameProvider.create()
      setIsMic(true)
    } catch {
      // No mic or permission denied → fall back to the synthetic voice so the
      // experience (and the demo) still works fully.
      providerRef.current = new SynthFrameProvider()
      setIsMic(false)
    }
    setStatus('ready')
  }, [status])

  const press = useCallback(() => {
    if (status !== 'ready') return
    holdingRef.current = true
    holdStartRef.current = performance.now()
    bestRef.current = 0
    sustainedRef.current = 0
    voicedRunRef.current = 0
    voicedFramesRef.current = 0
    setIsHolding(true)
  }, [status])

  const finishHold = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setIsHolding(false)
    setActive(false)
    const provider = providerRef.current
    if (provider instanceof SynthFrameProvider) provider.silence()

    // Only count it if the child actually said something sustained. This is the
    // fix for "rewarded XP despite saying nothing": silence/noise produces too
    // few voiced frames, so we coach instead of rewarding.
    if (voicedFramesRef.current < MIN_VOICED_FRAMES) {
      onNoSoundRef.current?.()
      return
    }
    onAttemptRef.current(Math.round(bestRef.current * 100))
  }, [])

  const release = finishHold

  // The animation loop — installed once we're ready, torn down on cleanup.
  useEffect(() => {
    if (status !== 'ready') return
    let alive = true

    const tick = () => {
      if (!alive) return
      const provider = providerRef.current
      if (provider) {
        // In demo mode, drive the synth toward the target while holding.
        if (provider instanceof SynthFrameProvider) {
          if (holdingRef.current) {
            const t = (performance.now() - holdStartRef.current) / DEMO_RAMP_MS
            provider.speak(targetRef.current, Math.min(0.95, 0.2 + t * 0.8))
          } else {
            provider.silence()
          }
        }

        const samples = provider.read()
        const f = analyzeFrame(samples, provider.sampleRate)
        const s = scoreFrame(f, targetRef.current)

        // A frame is "active" (real, on-target speech) only when it cleared the
        // scorer's voicing/periodicity gates AND its energy is clearly above the
        // ambient floor we've been learning. scoreFrame returns accuracy 0 for
        // silence/noise, so accuracy>0 already implies the gates passed.
        const floor = Math.max(ABS_ENERGY_FLOOR, noiseFloorRef.current * NOISE_MARGIN)
        const frameActive = s.accuracy > 0 && f.rms > floor

        if (holdingRef.current) {
          if (frameActive) {
            voicedFramesRef.current += 1
            voicedRunRef.current += 1
            // Smoothed accuracy needs several good frames in a row to climb.
            sustainedRef.current = sustainedRef.current * 0.7 + s.accuracy * 0.3
            // Only let the score "lock in" after a sustained run — a single
            // fluke frame can't win.
            if (voicedRunRef.current >= MIN_VOICED_RUN) {
              bestRef.current = Math.max(bestRef.current, sustainedRef.current)
            }
          } else {
            voicedRunRef.current = 0
            sustainedRef.current *= 0.6 // decay when they stop / go quiet
          }
          if (performance.now() - holdStartRef.current > MAX_HOLD_MS) finishHold()
          setLevel(sustainedRef.current)
        } else {
          // Idle: learn the room's noise floor and let the meter fall to rest.
          noiseFloorRef.current = noiseFloorRef.current * 0.9 + f.rms * 0.1
          sustainedRef.current *= 0.85
          setLevel(sustainedRef.current)
        }

        setFrame(f)
        setScore(s)
        setActive(holdingRef.current && frameActive)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      alive = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [status, finishHold])

  // Release the audio device when the hook unmounts.
  useEffect(() => {
    return () => providerRef.current?.stop()
  }, [])

  return { status, isMic, error, frame, score, level, isHolding, active, start, press, release }
}

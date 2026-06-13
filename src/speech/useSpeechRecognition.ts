// useSpeechRecognition.ts — Thin React wrapper over the browser Speech API.
//
// The Web Speech API (window.SpeechRecognition / webkitSpeechRecognition) is the
// browser's built-in ASR — the same engine that powers voice search. It is far
// more robust on real children's voices than our hand-rolled formant analysis.
// Caveat: in Chrome it streams audio to Google's servers, so it needs a network
// connection (and is not "on-device"); unsupported browsers fall back elsewhere.
//
// The vendor-prefixed API has no entry in TypeScript's DOM lib, so we declare the
// minimal surface we use.

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SpeechAlternative {
  transcript: string
  confidence: number
}

// --- minimal Web Speech API typings ---------------------------------------
interface SRAlternative {
  transcript: string
  confidence: number
}
interface SRResult {
  readonly length: number
  isFinal: boolean
  [index: number]: SRAlternative
}
interface SRResultList {
  readonly length: number
  [index: number]: SRResult
}
interface SREvent {
  results: SRResultList
}
interface SRErrorEvent {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  maxAlternatives: number
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SREvent) => void) | null
  onerror: ((e: SRErrorEvent) => void) | null
  onend: (() => void) | null
}
type SRCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SRCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionOptions {
  lang?: string
  maxAlternatives?: number
  /** If no final result arrives within this window, we stop and report no-speech. */
  silenceTimeoutMs?: number
  /** Fired once per utterance with the ranked alternative transcripts. */
  onResult?: (alternatives: SpeechAlternative[]) => void
  /** Fired on timeout / no speech detected. */
  onNoSpeech?: () => void
}

export interface SpeechRecognitionState {
  supported: boolean
  listening: boolean
  /** Live partial transcript, for on-screen liveness. */
  interim: string
  error: string | null
  start: () => void
  stop: () => void
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): SpeechRecognitionState {
  const { lang = 'en-US', maxAlternatives = 3, silenceTimeoutMs = 6000 } = opts

  const [supported] = useState(() => getRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const timerRef = useRef<number | null>(null)
  const gotResultRef = useRef(false)
  const onResultRef = useRef(opts.onResult)
  const onNoSpeechRef = useRef(opts.onNoSpeech)
  onResultRef.current = opts.onResult
  onNoSpeechRef.current = opts.onNoSpeech

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const stop = useCallback(() => {
    clearTimer()
    try {
      recRef.current?.stop()
    } catch {
      // stop() throws if not started — ignore
    }
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    // Fresh instance per utterance — reusing one after it ends is flaky.
    const rec = new Ctor()
    rec.lang = lang
    rec.maxAlternatives = maxAlternatives
    rec.continuous = false
    rec.interimResults = true
    recRef.current = rec
    gotResultRef.current = false
    setError(null)
    setInterim('')

    rec.onresult = (e: SREvent) => {
      const result = e.results[e.results.length - 1]
      if (!result) return
      if (!result.isFinal) {
        setInterim(result[0]?.transcript ?? '')
        return
      }
      // Final: collect the ranked alternatives.
      gotResultRef.current = true
      clearTimer()
      const alts: SpeechAlternative[] = []
      for (let i = 0; i < result.length; i++) {
        alts.push({ transcript: result[i].transcript, confidence: result[i].confidence ?? 0 })
      }
      setInterim('')
      onResultRef.current?.(alts)
    }
    rec.onerror = (e: SRErrorEvent) => {
      clearTimer()
      if (e.error === 'no-speech' || e.error === 'aborted') {
        onNoSpeechRef.current?.()
      } else {
        setError(e.error)
      }
      setListening(false)
    }
    rec.onend = () => {
      clearTimer()
      setListening(false)
      // Ended with nothing final → treat as no speech.
      if (!gotResultRef.current) onNoSpeechRef.current?.()
    }

    try {
      rec.start()
      setListening(true)
      // Manual silence guard on top of the engine's own no-speech detection.
      timerRef.current = window.setTimeout(() => {
        if (!gotResultRef.current) stop()
      }, silenceTimeoutMs)
    } catch {
      setError('start-failed')
    }
  }, [lang, maxAlternatives, silenceTimeoutMs, stop])

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      clearTimer()
      try {
        recRef.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  return { supported, listening, interim, error, start, stop }
}

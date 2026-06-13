// useAttemptRecorder.ts — Records each spoken attempt as a short clip and feeds
// the live waveform visualizer.
//
// One getUserMedia stream (audio, plus video when the webcam toggle is on) does
// double duty: an AnalyserNode drives the live waveform / volume ring, and a
// MediaRecorder captures a clip per attempt. While recording we also sample a
// loudness envelope so the replay scrubber can draw the clip's shape without
// re-decoding the blob.
//
// PRIVACY: clips are in-memory object URLs only — never uploaded, never written
// to disk, revoked on replacement/unmount, and gone on reload. The webcam is
// opt-in. Everything degrades gracefully: if the mic/recorder is unavailable the
// speech scoring still works, just without clips or the live waveform.

import { useCallback, useEffect, useRef, useState } from 'react'
import { rms } from '../audio/dsp'

export interface RecordedClip {
  url: string
  kind: 'video' | 'audio'
  /** Loudness envelope (0..1 samples) captured during recording. */
  envelope: number[]
  durationMs: number
}

/** Pick the best supported MediaRecorder container/codec. */
function pickMime(video: boolean): string {
  const candidates = video
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

export interface AttemptRecorder {
  supported: boolean
  analyser: AnalyserNode | null
  /** Smoothed live loudness 0..1 (for the mic ring). */
  level: number
  hasCamera: boolean
  recording: boolean
  beginClip: () => void
  endClip: () => Promise<RecordedClip | null>
}

export function useAttemptRecorder(active: boolean, webcam: boolean): AttemptRecorder {
  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [level, setLevel] = useState(0)
  const [hasCamera, setHasCamera] = useState(false)
  const [recording, setRecording] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const envRef = useRef<number[]>([])
  const recordingRef = useRef(false)
  const wantStartRef = useRef(false)
  const startTimeRef = useRef(0)
  const mimeRef = useRef('')
  const kindRef = useRef<'video' | 'audio'>('audio')
  const resolveRef = useRef<((c: RecordedClip | null) => void) | null>(null)
  const smoothRef = useRef(0)
  const startRecorderRef = useRef<() => void>(() => {})

  // Begin a MediaRecorder on the current stream.
  startRecorderRef.current = () => {
    const stream = streamRef.current
    if (!stream || !supported || recordingRef.current) return
    const video = stream.getVideoTracks().length > 0
    const mime = pickMime(video)
    mimeRef.current = mime
    kindRef.current = video ? 'video' : 'audio'
    try {
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      envRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const type = mimeRef.current || (kindRef.current === 'video' ? 'video/webm' : 'audio/webm')
        const blob = new Blob(chunksRef.current, { type })
        const clip: RecordedClip = {
          url: URL.createObjectURL(blob),
          kind: kindRef.current,
          envelope: envRef.current.slice(),
          durationMs: performance.now() - startTimeRef.current,
        }
        recordingRef.current = false
        setRecording(false)
        resolveRef.current?.(clip)
        resolveRef.current = null
      }
      startTimeRef.current = performance.now()
      rec.start()
      recRef.current = rec
      recordingRef.current = true
      wantStartRef.current = false
      setRecording(true)
    } catch {
      // recorder construction failed — leave scoring intact, just no clip
    }
  }

  // Open / close the media stream on active / webcam changes.
  useEffect(() => {
    if (!active || !supported) return
    let cancelled = false
    let raf = 0

    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
        video: webcam ? { width: 320, height: 240, facingMode: 'user' } : false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setHasCamera(stream.getVideoTracks().length > 0)
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const an = ctx.createAnalyser()
        an.fftSize = 1024
        src.connect(an)
        setAnalyser(an)

        const buf = new Float32Array(an.fftSize)
        const tick = () => {
          an.getFloatTimeDomainData(buf)
          const r = rms(buf)
          smoothRef.current = smoothRef.current * 0.7 + Math.min(1, r * 6) * 0.3
          setLevel(smoothRef.current)
          if (recordingRef.current && envRef.current.length < 600) {
            envRef.current.push(Math.min(1, r * 5))
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        // A clip was requested before the stream was ready → start now.
        if (wantStartRef.current) startRecorderRef.current()
      })
      .catch(() => {
        // denied / unavailable — degrade silently
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      try {
        if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
      } catch {
        // ignore
      }
      recRef.current = null
      recordingRef.current = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      void ctxRef.current?.close()
      ctxRef.current = null
      setAnalyser(null)
      setLevel(0)
    }
  }, [active, webcam, supported])

  const beginClip = useCallback(() => {
    if (recordingRef.current) return
    if (streamRef.current) startRecorderRef.current()
    else wantStartRef.current = true // start as soon as the stream opens
  }, [])

  const endClip = useCallback((): Promise<RecordedClip | null> => {
    return new Promise((resolve) => {
      wantStartRef.current = false
      const rec = recRef.current
      if (!rec || rec.state === 'inactive' || !recordingRef.current) {
        resolve(null)
        return
      }
      resolveRef.current = resolve
      // Small tail so we capture the end of the word.
      window.setTimeout(() => {
        try {
          rec.stop()
        } catch {
          resolve(null)
        }
      }, 250)
    })
  }, [])

  return { supported, analyser, level, hasCamera, recording, beginClip, endClip }
}

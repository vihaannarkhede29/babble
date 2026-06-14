// ReplayClip.tsx — One recorded attempt, played back in slow motion.
//
// Shows the clip (webcam video if recorded, else just the audio + waveform), the
// transcript the recogniser heard, the score, and a waveform of the clip's
// loudness envelope with a playhead that tracks playback. Slow-mo lets a child
// (or an SLP) study exactly how the mouth moved on a good vs a tricky try.

import { useRef, useState } from 'react'
import type { RecordedClip } from '../speech/useAttemptRecorder'
import { scoreColorPct } from '../lib/colors'

export interface AttemptClip {
  clip: RecordedClip
  /** What the recogniser heard. */
  transcript: string
  score: number
  matched: boolean
}

interface Props {
  title: string
  badge: string // emoji
  entry: AttemptClip
}

const SPEEDS = [1, 0.5, 0.25]

export function ReplayClip({ title, badge, entry }: Props) {
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  const [speed, setSpeed] = useState(0.5)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  const play = () => {
    const el = mediaRef.current
    if (!el) return
    el.playbackRate = speed
    el.currentTime = 0
    void el.play()
  }

  const onTime = () => {
    const el = mediaRef.current
    if (el && el.duration > 0) setProgress(el.currentTime / el.duration)
  }

  const env = entry.clip.envelope
  const color = scoreColorPct(entry.score)

  return (
    <div className="replay-card">
      <div className="replay-head">
        <span className="replay-title">
          {badge} {title}
        </span>
        <span className="replay-score" style={{ color }}>
          {entry.matched ? '⭐ ' : ''}
          {entry.score}%
        </span>
      </div>

      {entry.clip.kind === 'video' ? (
        <video
          ref={(el) => {
            mediaRef.current = el
          }}
          src={entry.clip.url}
          className="replay-video"
          playsInline
          onTimeUpdate={onTime}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <audio
          ref={(el) => {
            mediaRef.current = el
          }}
          src={entry.clip.url}
          onTimeUpdate={onTime}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      {/* loudness-envelope waveform with playhead */}
      <svg viewBox="0 0 100 24" className="replay-wave" preserveAspectRatio="none">
        {env.map((v, i) => {
          const x = (i / Math.max(1, env.length - 1)) * 100
          const h = Math.max(1.2, v * 22)
          const passed = i / Math.max(1, env.length - 1) <= progress
          return (
            <rect
              key={i}
              x={x}
              y={(24 - h) / 2}
              width={100 / Math.max(1, env.length)}
              height={h}
              fill={passed ? color : '#D8CFBF'}
            />
          )
        })}
        {env.length === 0 && <rect x="0" y="11" width="100" height="2" fill="#D8CFBF" />}
        <line x1={progress * 100} y1="0" x2={progress * 100} y2="24" stroke="#1b3a2d" strokeWidth="0.5" />
      </svg>

      <div className="replay-heard">I heard “{entry.transcript || '—'}”</div>

      <div className="replay-controls">
        <button className="replay-play" onClick={play} aria-label="Play in slow motion">
          {playing ? '▶ playing…' : '▶ Replay'}
        </button>
        <div className="replay-speeds">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`replay-speed${s === speed ? ' replay-speed--active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s === 1 ? '1×' : s === 0.5 ? '½×' : '¼×'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

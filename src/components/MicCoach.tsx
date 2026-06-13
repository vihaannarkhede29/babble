// MicCoach.tsx — The practice screen. This is the core wedge end-to-end:
// pick a sound → speak → live formant analysis → score + mouth diagram +
// dragon reaction → attempt saved to the offline store.

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Phoneme } from '../lib/types'
import { PHONEMES } from '../audio/phonemes'
import { usePracticeEngine } from '../audio/usePracticeEngine'
import { gameStore, masteryByPhoneme, xpForScore } from '../game/store'
import { dragonLine, eventForScore, type DragonEvent } from '../game/dragon'
import { MouthDiagram } from './MouthDiagram'
import { VowelSpace } from './VowelSpace'
import { Dragon } from './Dragon'
import { ScoreMeter } from './ScoreMeter'
import { SoundPicker } from './SoundPicker'
import { scoreColor } from '../lib/colors'

interface DragonState {
  line: string
  mood: 'idle' | 'listening' | 'happy' | 'sad'
}

export function MicCoach() {
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const mastery = useMemo(() => masteryByPhoneme(save.attempts), [save.attempts])

  const [target, setTarget] = useState<Phoneme>(PHONEMES[0])
  const [dragon, setDragon] = useState<DragonState>({
    line: dragonLine({ event: 'greet' }),
    mood: 'idle',
  })
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null)

  const nonceRef = useRef(0)
  const lastHintRef = useRef('')

  // Called by the engine when a hold ends with a real vocalisation.
  const handleAttempt = useCallback(
    (score: number) => {
      const leveledUp = gameStore.recordAttempt(target.id, score)
      nonceRef.current += 1
      const nonce = nonceRef.current

      setXpFloat({ amount: xpForScore(score), key: nonce })

      if (leveledUp) {
        setDragon({ line: dragonLine({ event: 'levelUp', nonce }), mood: 'happy' })
        return
      }
      const event: DragonEvent = eventForScore(score)
      const mood = event === 'success' ? 'happy' : event === 'struggle' ? 'sad' : 'listening'
      setDragon({
        line: dragonLine({ event, sound: target.label, hint: lastHintRef.current, nonce }),
        mood,
      })
    },
    [target],
  )

  // Fired when a hold contained no real speech — coach, never reward silence.
  const handleNoSound = useCallback(() => {
    nonceRef.current += 1
    setDragon({
      line: dragonLine({ event: 'quiet', nonce: nonceRef.current }),
      mood: 'listening',
    })
  }, [])

  const engine = usePracticeEngine(target, handleAttempt, handleNoSound)

  // Keep the most recent coaching hint so we can attach it to a "close" attempt.
  if (engine.score && engine.score.hint) lastHintRef.current = engine.score.hint

  const onPickSound = (p: Phoneme) => {
    setTarget(p)
    nonceRef.current += 1
    setDragon({
      line: `Let's try ${p.label}, like in "${p.exampleWord}". ${p.emoji}`,
      mood: 'listening',
    })
  }

  // Drive the live visuals only from genuinely voiced, on-target frames, so the
  // marker/mouth don't twitch on background noise.
  const live = engine.active && engine.score ? engine.score.live : null
  const mouthOpen = engine.active && engine.score ? engine.score.live.open : 0

  // --- Start gate: audio needs a user gesture to begin. ---
  if (engine.status !== 'ready') {
    return (
      <div className="coach coach--start">
        <Dragon line={dragon.line} mood="idle" />
        <button className="start-btn" onClick={() => void engine.start()}
          disabled={engine.status === 'starting'}>
          {engine.status === 'starting' ? 'Starting…' : '🎤 Tap to start'}
        </button>
        <p className="start-hint">
          We'll ask for your microphone. No mic? No problem — Sparky brings a demo voice.
        </p>
      </div>
    )
  }

  return (
    <div className="coach">
      {/* Left: companion + sound choices */}
      <aside className="coach-left">
        <Dragon line={dragon.line} mood={dragon.mood} mouthOpen={mouthOpen} />
        {!engine.isMic && <div className="demo-badge">🔊 Demo voice (no mic)</div>}
      </aside>

      {/* Center: the diagram + the talk button */}
      <section className="coach-center">
        <div className="prompt">
          Say <strong>{target.label}</strong> — like in “{target.exampleWord}” {target.emoji}
        </div>
        <MouthDiagram target={target} live={live} accuracy={engine.level} />
        <button
          className={`talk-btn${engine.isHolding ? ' talk-btn--active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            engine.press()
          }}
          onPointerUp={engine.release}
          onPointerLeave={engine.release}
          onPointerCancel={engine.release}
          onKeyDown={(e) => {
            if (e.key === ' ' && !engine.isHolding) engine.press()
          }}
          onKeyUp={(e) => {
            if (e.key === ' ') engine.release()
          }}
        >
          {engine.isHolding ? '🎙️ Listening…' : '🎤 Hold & speak'}
        </button>
        {xpFloat && (
          <div className="xp-float" key={xpFloat.key}>
            +{xpFloat.amount} XP
          </div>
        )}
      </section>

      {/* Right: live acoustic feedback */}
      <section className="coach-right">
        <ScoreMeter level={engine.level} />
        {target.mode === 'formant' ? (
          <VowelSpace target={target} live={live} accuracy={engine.level} />
        ) : (
          <BrightnessMeter
            centroid={engine.isHolding ? engine.frame?.centroid ?? 0 : 0}
            targetHz={target.centroidTarget ?? 5000}
            accuracy={engine.level}
          />
        )}
        {engine.score?.hint && engine.isHolding && (
          <div className="hint-chip" style={{ borderColor: scoreColor(engine.level) }}>
            {engine.score.hint}
          </div>
        )}
      </section>

      {/* Sound picker spans the bottom */}
      <footer className="coach-footer">
        <SoundPicker phonemes={PHONEMES} activeId={target.id} mastery={mastery}
          onSelect={onPickSound} />
      </footer>
    </div>
  )
}

/** Horizontal "brightness" gauge for sibilants, with the target zone marked. */
function BrightnessMeter({
  centroid,
  targetHz,
  accuracy,
}: {
  centroid: number
  targetHz: number
  accuracy: number
}) {
  const MAXHZ = 9000
  const pos = Math.max(0, Math.min(1, centroid / MAXHZ)) * 100
  const goal = Math.max(0, Math.min(1, targetHz / MAXHZ)) * 100
  return (
    <div className="brightness">
      <div className="brightness-label">Brightness (tongue position)</div>
      <div className="brightness-track">
        <div className="brightness-goal" style={{ left: `${goal}%` }} />
        {centroid > 0 && (
          <div className="brightness-live" style={{ left: `${pos}%`, background: scoreColor(accuracy) }} />
        )}
      </div>
      <div className="brightness-ends">
        <span>shhh 🤫</span>
        <span>sss 🐍</span>
      </div>
    </div>
  )
}

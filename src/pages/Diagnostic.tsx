// Diagnostic.tsx — "Teach Blaze his first words." The child sees a picture, says
// the word once, and Blaze fills with energy. Under the hood each word is scored
// by our real engine (Web Speech → matchWord) and logged as a DiagAttempt; when
// the run ends we infer a per-phoneme screen (see diagnostic/inference.ts), write
// the personalization to the profile, and celebrate.
//
// One attempt per word (no retries) — this is a screener, not practice.

import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Blaze, type BlazeState } from '../components/Blaze'
import { Confetti } from '../components/Confetti'
import { StarRating } from '../components/StarRating'
import { WaveCanvas, type WaveStatus } from '../components/WaveCanvas'
import { DIAGNOSTIC_WORDS, type DiagnosticWord } from '../diagnostic/diagnosticWords'
import { computeResult, type DiagAttempt, type DiagnosticResult } from '../diagnostic/inference'
import { diagnosticStore } from '../diagnostic/store'
import { matchWord } from '../speech/match'
import { phonemeLabel, toIpaToken } from '../speech/phonemeTokens'
import { useSpeechRecognition, type SpeechAlternative } from '../speech/useSpeechRecognition'
import { useAttemptRecorder } from '../speech/useAttemptRecorder'
import type { PracticeWord } from '../speech/words'
import { useProfile, profileStore } from '../profile/store'
import { gameStore } from '../game/store'
import { playCorrectDing, playWordSuccessDing, prepareAudio } from '../lib/sounds'

const TOTAL = DIAGNOSTIC_WORDS.length

// Map the screener's focus token onto a catalogued phoneme id where one exists,
// so the screener also feeds the XP/level + the live progress chart.
const ARPA_TO_CATALOG: Record<string, string> = {
  S: 's', SH: 'sh', EE: 'iy', IY: 'iy', EH: 'eh', AE: 'ae',
  OH: 'ow', OW: 'ow', OO: 'uw', UW: 'uw', AA: 'aa', AO: 'aa',
}
function catalogId(token: string): string {
  return ARPA_TO_CATALOG[token] ?? toIpaToken(token)
}
/** Words needed to "fill" Blaze's energy bar (the rest is bonus). */
const ENERGY_GOAL = 12

/** Minimal PracticeWord so matchWord can score a diagnostic word. */
function targetFor(dw: DiagnosticWord): PracticeWord {
  return {
    id: dw.word,
    word: dw.word.toLowerCase(),
    emoji: dw.emoji,
    focusPhonemeId: '',
    focusLabel: phonemeLabel(dw.tests[0] ?? dw.phonemes[0]),
    phonemes: dw.phonemes.map(toIpaToken),
    focusIndex: 0,
    accept: [],
    nearMiss: [],
  }
}

export function Diagnostic() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const dragon = profile.dragonName.trim() || 'Blaze'

  const [idx, setIdx] = useState(0)
  const [started, setStarted] = useState(false)
  const [reaction, setReaction] = useState<BlazeState>('idle')
  const [phase, setPhase] = useState<'run' | 'done'>('run')
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [flash, setFlash] = useState<string>('')

  const idxRef = useRef(0)
  idxRef.current = idx
  const attemptsRef = useRef<DiagAttempt[]>([])
  const advanceTimer = useRef<number | null>(null)

  const recorder = useAttemptRecorder(started, false)

  const finish = useCallback(() => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    const res = computeResult(attemptsRef.current, Date.now())
    diagnosticStore.save(res)
    profileStore.completeDiagnostic(res.config)
    setResult(res)
    setReaction('celebrating')
    void playWordSuccessDing()
    setPhase('done')
  }, [])

  const advance = useCallback(() => {
    const nextIdx = idxRef.current + 1
    if (nextIdx >= TOTAL) {
      finish()
      return
    }
    setIdx(nextIdx)
    setReaction('idle')
    setFlash('')
  }, [finish])

  const onResult = useCallback(
    (alts: SpeechAlternative[]) => {
      const dw = DIAGNOSTIC_WORDS[idxRef.current]
      const m = matchWord(alts, targetFor(dw))
      const clear = m.matched || m.score >= 70
      attemptsRef.current = [
        ...attemptsRef.current,
        { word: dw.word, heard: m.heard, score: m.score, matched: m.matched, tests: dw.tests, at: Date.now() },
      ]
      // Also count it toward XP/level + the live progress chart.
      gameStore.recordAttempt(catalogId(dw.tests[0] ?? dw.phonemes[0]), m.score)
      setReaction(clear ? 'celebrating' : 'confused')
      setFlash(
        clear
          ? `Yum! “${m.heard}” — ${m.score}% match ⚡`
          : `Heard “${m.heard || '…'}” — ${m.score}% match`,
      )
      if (clear) void playCorrectDing()
      advanceTimer.current = window.setTimeout(advance, 1300)
    },
    [advance, dragon],
  )

  const onNoSpeech = useCallback(() => {
    setFlash("Didn't catch that — here's the next one!")
    setReaction('idle')
    advanceTimer.current = window.setTimeout(advance, 1100)
  }, [advance])

  const speech = useSpeechRecognition({ maxAlternatives: 3, onResult, onNoSpeech })

  const onMic = () => {
    if (speech.listening) {
      speech.stop()
      return
    }
    void prepareAudio()
    setStarted(true)
    setReaction('listening')
    setFlash('')
    speech.start()
  }

  // --- No Speech API → can't run the screener. Offer a graceful exit. ---
  if (!speech.supported) {
    return (
      <div className="intro">
        <Blaze state="confused" size="lg" />
        <h1 className="intro-title">This needs Chrome or Edge</h1>
        <p className="intro-lead">
          {dragon}'s first-words screen uses the browser speech recogniser, which your browser
          doesn't have. You can still practise with the offline coach.
        </p>
        <button
          className="btn-teal btn-pressable intro-start"
          onClick={() => {
            profileStore.completeDiagnostic({ priorityPhonemes: [], masteredPhonemes: [], avoidPhonemes: [] })
            navigate('/practice')
          }}
        >
          Go to practice →
        </button>
      </div>
    )
  }

  // --- Celebration / done ---
  if (phase === 'done' && result) {
    const stars = result.summary.clear >= 12 ? 3 : result.summary.clear >= 6 ? 2 : 1
    return (
      <div className="diag-done">
        <Confetti replay={1} />
        <Blaze state="celebrating" size="xl" glow={1} />
        <h1 className="diag-done-title">{dragon} can talk! 🎉</h1>
        <StarRating stars={stars} />
        <p className="diag-done-sub">
          You taught {dragon} <strong>{result.summary.wordsAttempted}</strong> words. He's got{' '}
          <strong>{result.summary.clear}</strong> sounds down strong
          {result.summary.needsPractice > 0
            ? ` and ${result.summary.needsPractice} to practise together.`
            : '!'}
        </p>
        <div className="diag-done-actions">
          <button className="btn-coral btn-pressable" onClick={() => navigate('/practice')}>
            Practise now 🎤
          </button>
          <button className="btn-teal btn-pressable" onClick={() => navigate('/diagnostic/report')}>
            Grown-up report 📋
          </button>
        </div>
        <button className="intro-skip" onClick={() => navigate('/')}>
          Back to home
        </button>
      </div>
    )
  }

  // --- The run ---
  const dw = DIAGNOSTIC_WORDS[idx]
  const energy = Math.min(1, attemptsRef.current.length / ENERGY_GOAL)
  const waveStatus: WaveStatus = speech.listening
    ? 'listening'
    : reaction === 'celebrating'
      ? 'success'
      : reaction === 'confused'
        ? 'error'
        : 'idle'

  return (
    <div className="diag">
      <div className="diag-top">
        <button className="diag-quit" onClick={() => navigate('/')} aria-label="Quit">
          ✕
        </button>
        <div className="diag-progress">
          Word {Math.min(idx + 1, TOTAL)} of {TOTAL}
        </div>
        {attemptsRef.current.length >= 4 && (
          <button className="diag-finish" onClick={finish}>
            Finish ✓
          </button>
        )}
      </div>

      {/* Blaze + energy bar */}
      <div className="diag-blaze">
        <Blaze state={reaction} size="lg" glow={energy} />
        <div className="energy">
          <div className="energy-label">⚡ {dragon}'s energy</div>
          <div className="energy-track">
            <div className="energy-fill" style={{ width: `${Math.round(energy * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Word card */}
      <div className="diag-card card-tactile">
        <div className="diag-emoji">{dw.emoji}</div>
        <div className="diag-word">{dw.word}</div>
      </div>

      <div className="diag-wave">
        <WaveCanvas analyser={recorder.analyser} status={waveStatus} />
      </div>

      <button
        className={`mic-orb${speech.listening ? ' mic-orb--listening' : ''}`}
        onClick={onMic}
        style={{ '--vol': recorder.level } as CSSProperties}
      >
        <span className="mic-orb-ring" />
        <span className="mic-orb-face">{speech.listening ? '👂' : '🎤'}</span>
        <span className="mic-orb-label">{speech.listening ? 'Listening…' : `Say “${dw.word}”`}</span>
      </button>

      <div className="diag-flash">
        {flash || (speech.interim ? `hearing: “${speech.interim}”` : ' ')}
      </div>
      {speech.error && (
        <div className="speech-error">
          {speech.error === 'not-allowed'
            ? 'Microphone blocked — allow it to teach Blaze.'
            : `Speech error: ${speech.error}`}
        </div>
      )}
    </div>
  )
}

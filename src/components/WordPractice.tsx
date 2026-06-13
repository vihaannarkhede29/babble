// WordPractice.tsx — The speech-recognition Practice screen.
//
// Flow: pick a word → tap the mic → the browser Speech API transcribes it →
// matchWord() fuzzy-matches it to the target → score, dragon reaction, XP. Along
// the way we also: drive a live interference-wave graph from the mic's FFT, light
// up the per-sound phoneme matrix, and record a short clip you can replay in
// slow motion (best try vs a tricky one). Webcam recording is opt-in and stays on
// the device. No Speech API (e.g. Firefox) → fall back to the offline MicCoach.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { WORDS, type PracticeWord } from '../speech/words'
import { buildCustomWord, loadCustomInputs, saveCustomInputs } from '../speech/customWords'
import { matchWord } from '../speech/match'
import { useSpeechRecognition, type SpeechAlternative } from '../speech/useSpeechRecognition'
import { useAttemptRecorder } from '../speech/useAttemptRecorder'
import { gameStore, masteryByPhoneme, xpForScore } from '../game/store'
import { dragonLine, eventForScore } from '../game/dragon'
import { Dragon } from './Dragon'
import { MicCoach } from './MicCoach'
import { Confetti } from './Confetti'
import { WaveCanvas, type WaveStatus } from './WaveCanvas'
import { PhonemeMatrix, type PhonemeStatus } from './PhonemeMatrix'
import { ReplayClip, type AttemptClip } from './ReplayClip'
import { ArticulationFace } from './ArticulationFace'
import { articulationFor } from '../speech/articulation'
import { scoreColorPct } from '../lib/colors'
import { playCorrectDing, playWordSuccessDing, prepareAudio } from '../lib/sounds'

interface DragonState {
  line: string
  mood: 'idle' | 'listening' | 'happy' | 'sad'
}

const idleMatrix = (w: PracticeWord): PhonemeStatus[] => w.phonemes.map(() => 'idle')

/** Infer per-phoneme status from the word-match result (no per-sound grading). */
function computeMatrix(word: PracticeWord, score: number, matched: boolean): PhonemeStatus[] {
  if (matched) return word.phonemes.map(() => 'success')
  if (score >= 55) {
    // Near-miss: the taught sound is the one that slipped.
    return word.phonemes.map((_, i) => (i === word.focusIndex ? 'error' : 'success'))
  }
  return word.phonemes.map(() => 'idle')
}

export function WordPractice({ initialWordId }: { initialWordId?: string } = {}) {
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const mastery = useMemo(() => masteryByPhoneme(save.attempts), [save.attempts])

  const firstWord = (initialWordId && WORDS.find((w) => w.id === initialWordId)) || WORDS[0]
  const [word, setWord] = useState<PracticeWord>(firstWord)
  const [matrix, setMatrix] = useState<PhonemeStatus[]>(() => idleMatrix(firstWord))
  const [started, setStarted] = useState(false)
  const [webcam, setWebcam] = useState(false)
  // When true, the graph slot shows the "how to move your mouth" animation
  // instead of the live wave (auto-on after a miss, toggleable any time).
  const [showHowTo, setShowHowTo] = useState(false)
  const [clips, setClips] = useState<{ best?: AttemptClip; tricky?: AttemptClip }>({})
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [lastHeard, setLastHeard] = useState('')
  const [levelUpKey, setLevelUpKey] = useState(0)
  const [customInputs, setCustomInputs] = useState<string[]>(() => loadCustomInputs())
  const [adding, setAdding] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState('')
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null)
  const [dragon, setDragon] = useState<DragonState>({
    line: dragonLine({ event: 'greet' }),
    mood: 'idle',
  })

  // Built-in words + the learner's own typed words (rebuilt from saved strings).
  const allWords = useMemo(() => {
    const custom = customInputs
      .map(buildCustomWord)
      .filter((w): w is PracticeWord => w !== null)
    return [...WORDS, ...custom]
  }, [customInputs])

  const wordRef = useRef(word)
  wordRef.current = word
  const nonceRef = useRef(0)

  const recorder = useAttemptRecorder(started, webcam)
  const recorderRef = useRef(recorder)
  recorderRef.current = recorder

  const onResult = useCallback(async (alternatives: SpeechAlternative[]) => {
    const target = wordRef.current
    const m = matchWord(alternatives, target)
    const clip = await recorderRef.current.endClip()

    nonceRef.current += 1
    setLastScore(m.score)
    setLastHeard(m.heard)
    setMatrix(computeMatrix(target, m.score, m.matched))
    // On a miss, show how to make the focus sound.
    setShowHowTo(!m.matched && m.score < 85)
    // Audio reward (ported from partner): fanfare on a win, soft ding on a strong try.
    if (m.matched) void playWordSuccessDing()
    else if (m.score >= 85) void playCorrectDing()
    const leveledUp = gameStore.recordAttempt(target.focusPhonemeId, m.score)
    setXpFloat({ amount: xpForScore(m.score), key: nonceRef.current })

    if (leveledUp) {
      setLevelUpKey((k) => k + 1)
      setDragon({ line: dragonLine({ event: 'levelUp', nonce: nonceRef.current }), mood: 'happy' })
    } else {
      const event = eventForScore(m.score)
      setDragon({
        line: m.matched
          ? dragonLine({ event: 'success', nonce: nonceRef.current })
          : m.feedback || dragonLine({ event, nonce: nonceRef.current }),
        mood: event === 'success' ? 'happy' : event === 'struggle' ? 'sad' : 'listening',
      })
    }

    // File the clip as the best try (a win) or the tricky one (a miss).
    if (clip) {
      const entry: AttemptClip = { clip, transcript: m.heard, score: m.score, matched: m.matched }
      const isWin = m.matched || m.score >= 85
      setClips((prev) => {
        const slot = isWin ? 'best' : 'tricky'
        const old = prev[slot]
        if (old) URL.revokeObjectURL(old.clip.url)
        return { ...prev, [slot]: entry }
      })
    }
  }, [])

  const onNoSpeech = useCallback(() => {
    void recorderRef.current.endClip() // discard — nothing was said
    nonceRef.current += 1
    setLastScore(null)
    setDragon({ line: dragonLine({ event: 'quiet', nonce: nonceRef.current }), mood: 'listening' })
  }, [])

  const speech = useSpeechRecognition({ maxAlternatives: 3, onResult, onNoSpeech })

  // Revoke any clip object URLs on unmount.
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  useEffect(() => {
    return () => {
      if (clipsRef.current.best) URL.revokeObjectURL(clipsRef.current.best.clip.url)
      if (clipsRef.current.tricky) URL.revokeObjectURL(clipsRef.current.tricky.clip.url)
    }
  }, [])

  const onMic = () => {
    if (speech.listening) {
      speech.stop()
      return
    }
    void prepareAudio() // resume the audio context on this user gesture
    setStarted(true)
    setLastScore(null)
    setShowHowTo(false)
    setMatrix(idleMatrix(wordRef.current))
    recorderRef.current.beginClip()
    speech.start()
  }

  const onPickWord = (w: PracticeWord) => {
    setWord(w)
    setMatrix(idleMatrix(w))
    setLastScore(null)
    setShowHowTo(false)
    setDragon({ line: `Let's say “${w.word}”! ${w.emoji}`, mood: 'listening' })
  }

  const submitWord = () => {
    const w = buildCustomWord(addInput)
    if (!w) {
      setAddError('Type a real word (letters only).')
      return
    }
    if (!allWords.some((x) => x.id === w.id)) {
      const next = [...customInputs, w.word]
      setCustomInputs(next)
      saveCustomInputs(next)
    }
    setAddInput('')
    setAddError('')
    setAdding(false)
    onPickWord(w) // jump straight into practising it (matrix shows the breakdown)
  }

  // --- Fallback: no Speech API → use the offline formant coach. ---
  if (!speech.supported) {
    return (
      <div>
        <div className="fallback-banner">
          🔌 Your browser doesn't support speech recognition. Using the offline sound coach.
        </div>
        <MicCoach />
      </div>
    )
  }

  const waveStatus: WaveStatus = speech.listening
    ? 'listening'
    : lastScore === null
      ? 'idle'
      : lastScore >= 85
        ? 'success'
        : lastScore >= 1
          ? 'error'
          : 'idle'

  // Articulation of the focus sound (e.g. ship → /ʃ/), for the "how to" view.
  const focusArtic = articulationFor(word.phonemes[word.focusIndex] ?? word.phonemes[0])

  return (
    <div className="coach">
      {levelUpKey > 0 && <Confetti replay={levelUpKey} />}
      <aside className="coach-left">
        <Dragon line={dragon.line} mood={dragon.mood} mouthOpen={speech.listening ? recorder.level : 0} />
      </aside>

      <section className="coach-center">
        <div className="prompt">
          <div className="prompt-word">
            Say “{word.word}” {word.emoji}
          </div>
          <div className="prompt-sub">
            the <strong>{word.focusLabel}</strong> sound
          </div>
        </div>

        <PhonemeMatrix phonemes={word.phonemes} statuses={matrix} />

        <div className="graph-slot">
          {showHowTo ? (
            <div className="howto-card">
              <div className="howto-head">👄 Make the {focusArtic.label} sound</div>
              <ArticulationFace target={focusArtic} />
              <div className="howto-cue">{focusArtic.cue}</div>
            </div>
          ) : (
            <WaveCanvas analyser={recorder.analyser} status={waveStatus} />
          )}
        </div>
        <button className="howto-toggle" onClick={() => setShowHowTo((v) => !v)}>
          {showHowTo ? '🌊 Show wave' : '👄 How to say it'}
        </button>

        <button
          className={`mic-orb${speech.listening ? ' mic-orb--listening' : ''}`}
          onClick={onMic}
          style={{ '--vol': recorder.level } as CSSProperties}
        >
          <span className="mic-orb-ring" />
          <span className="mic-orb-face">{speech.listening ? '👂' : '🎤'}</span>
          <span className="mic-orb-label">{speech.listening ? 'Listening…' : 'Tap & say it'}</span>
        </button>

        {lastScore !== null && !speech.listening && (
          <div className="score-card card-tactile">
            <div className="score-num" style={{ color: scoreColorPct(lastScore) }}>
              {lastScore}
              <span className="score-pct">%</span>
            </div>
            <div className="score-info">
              <div className="score-label">
                {lastScore >= 85 ? 'Great match! ⭐' : lastScore >= 60 ? 'So close!' : 'Keep trying!'}
              </div>
              <div className="score-heard">I heard “{lastHeard || '—'}”</div>
            </div>
            <div className="score-method" title="Browser speech recognition + fuzzy word match (0–100)">
              match&nbsp;score
            </div>
          </div>
        )}

        {speech.listening && speech.interim && (
          <div className="interim">hearing: “{speech.interim}”</div>
        )}
        {speech.error && (
          <div className="speech-error">
            {speech.error === 'not-allowed'
              ? 'Microphone blocked — allow it in your browser to practise.'
              : `Speech error: ${speech.error}`}
          </div>
        )}
        {xpFloat && (
          <div className="xp-float" key={xpFloat.key}>
            +{xpFloat.amount} XP
          </div>
        )}
      </section>

      <section className="coach-right">
        <div className="replay-panel-head">
          <span>🎬 Replays</span>
          <button
            className={`cam-toggle${webcam ? ' cam-toggle--on' : ''}`}
            onClick={() => setWebcam((v) => !v)}
            title="Record video of attempts (stays on this device)"
          >
            {webcam ? '📷 Camera on' : '📷 Camera off'}
          </button>
        </div>
        {clips.best ? (
          <ReplayClip title="Best try" badge="⭐" entry={clips.best} />
        ) : (
          <div className="coach-tip">Your best try will appear here ⭐</div>
        )}
        {clips.tricky && <ReplayClip title="Tricky one" badge="🤔" entry={clips.tricky} />}
        <div className="privacy-note">Clips stay on this device and vanish on reload.</div>
      </section>

      <footer className="coach-footer">
        {adding && (
          <div className="add-word-form">
            <input
              className="add-word-input"
              autoFocus
              placeholder="Type a word… (e.g. rabbit)"
              value={addInput}
              maxLength={20}
              onChange={(e) => {
                setAddInput(e.target.value)
                setAddError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitWord()
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button className="add-word-go" onClick={submitWord}>
              Break it down →
            </button>
            <button className="add-word-cancel" onClick={() => setAdding(false)}>
              ✕
            </button>
            {addError && <span className="add-word-error">{addError}</span>}
          </div>
        )}
        <div className="word-picker" role="tablist" aria-label="Choose a word">
          {allWords.map((w) => {
            const m = mastery.find((x) => x.phonemeId === w.focusPhonemeId)
            const active = w.id === word.id
            const custom = w.id.startsWith('custom:')
            return (
              <button
                key={w.id}
                role="tab"
                aria-selected={active}
                className={`word-card${active ? ' word-card--active' : ''}${custom ? ' word-card--custom' : ''}`}
                onClick={() => onPickWord(w)}
              >
                <span className="sound-emoji">{w.emoji}</span>
                <span className="sound-label">{w.word}</span>
                <span className="sound-word">{w.focusLabel}</span>
                {m && m.attempts > 0 && (
                  <span className="sound-mastery" style={{ background: scoreColorPct(m.avg) }} />
                )}
              </button>
            )
          })}
          <button className="word-card word-card--add" onClick={() => setAdding(true)} aria-label="Add your own word">
            <span className="sound-emoji">➕</span>
            <span className="sound-label">Add</span>
            <span className="sound-word">your word</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

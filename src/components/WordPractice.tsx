// WordPractice.tsx — The speech-recognition Practice screen.
//
// Flow: pick a word → tap the mic → the browser Speech API transcribes what you
// said → matchWord() fuzzy-matches it to the target → score, dragon reaction, XP.
// A live volume ring on the mic button reacts the instant you speak.
//
// When the browser has no Speech API (e.g. Firefox), we fall back to the
// offline formant-based MicCoach so the app still works.

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { WORDS, type PracticeWord } from '../speech/words'
import { matchWord, type MatchResult } from '../speech/match'
import { useSpeechRecognition, type SpeechAlternative } from '../speech/useSpeechRecognition'
import { useMicVolume } from '../speech/useMicVolume'
import { gameStore, masteryByPhoneme, xpForScore } from '../game/store'
import { dragonLine, eventForScore } from '../game/dragon'
import { Dragon } from './Dragon'
import { ScoreMeter } from './ScoreMeter'
import { MicCoach } from './MicCoach'
import { scoreColorPct } from '../lib/colors'

interface DragonState {
  line: string
  mood: 'idle' | 'listening' | 'happy' | 'sad'
}

export function WordPractice() {
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const mastery = useMemo(() => masteryByPhoneme(save.attempts), [save.attempts])

  const [word, setWord] = useState<PracticeWord>(WORDS[0])
  const [result, setResult] = useState<MatchResult | null>(null)
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null)
  const [dragon, setDragon] = useState<DragonState>({
    line: dragonLine({ event: 'greet' }),
    mood: 'idle',
  })

  const wordRef = useRef(word)
  wordRef.current = word
  const nonceRef = useRef(0)

  const onResult = useCallback((alternatives: SpeechAlternative[]) => {
    const target = wordRef.current
    const m = matchWord(alternatives, target)
    setResult(m)
    nonceRef.current += 1
    const leveledUp = gameStore.recordAttempt(target.focusPhonemeId, m.score)
    setXpFloat({ amount: xpForScore(m.score), key: nonceRef.current })

    if (leveledUp) {
      setDragon({ line: dragonLine({ event: 'levelUp', nonce: nonceRef.current }), mood: 'happy' })
      return
    }
    const event = eventForScore(m.score)
    // For a near-miss, the specific "I heard X" feedback beats a generic line.
    const line = m.matched
      ? dragonLine({ event: 'success', nonce: nonceRef.current })
      : m.feedback || dragonLine({ event, nonce: nonceRef.current })
    setDragon({
      line,
      mood: event === 'success' ? 'happy' : event === 'struggle' ? 'sad' : 'listening',
    })
  }, [])

  const onNoSpeech = useCallback(() => {
    nonceRef.current += 1
    setResult(null)
    setDragon({ line: dragonLine({ event: 'quiet', nonce: nonceRef.current }), mood: 'listening' })
  }, [])

  const speech = useSpeechRecognition({ maxAlternatives: 3, onResult, onNoSpeech })
  const volume = useMicVolume(speech.listening)

  const onPickWord = (w: PracticeWord) => {
    setWord(w)
    setResult(null)
    setDragon({ line: `Let's say “${w.word}”! ${w.emoji}`, mood: 'listening' })
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

  return (
    <div className="coach">
      <aside className="coach-left">
        <Dragon line={dragon.line} mood={dragon.mood} mouthOpen={speech.listening ? volume : 0} />
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

        <button
          className={`mic-orb${speech.listening ? ' mic-orb--listening' : ''}`}
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
          style={{ '--vol': volume } as CSSProperties}
        >
          <span className="mic-orb-ring" />
          <span className="mic-orb-face">{speech.listening ? '👂' : '🎤'}</span>
          <span className="mic-orb-label">{speech.listening ? 'Listening…' : 'Tap & say it'}</span>
        </button>

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
        {result ? (
          <>
            <ScoreMeter level={result.score / 100} />
            <div className="heard-chip" style={{ borderColor: scoreColorPct(result.score) }}>
              {result.heard ? <>I heard “{result.heard}”</> : 'No words heard'}
            </div>
          </>
        ) : (
          <div className="coach-tip">Tap the mic and say the word out loud 🎤</div>
        )}
      </section>

      <footer className="coach-footer">
        <div className="word-picker" role="tablist" aria-label="Choose a word">
          {WORDS.map((w) => {
            const m = mastery.find((x) => x.phonemeId === w.focusPhonemeId)
            const active = w.id === word.id
            return (
              <button
                key={w.id}
                role="tab"
                aria-selected={active}
                className={`word-card${active ? ' word-card--active' : ''}`}
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
        </div>
      </footer>
    </div>
  )
}

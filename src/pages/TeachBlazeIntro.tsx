// TeachBlazeIntro.tsx — The framing screen for the disguised phoneme screener.
//
// To the child it's a story: Blaze just hatched and can't talk yet; saying words
// out loud "feeds" him the sounds he needs. To us, each word is a coverage probe
// across the major English phonemes (see diagnosticWords.ts). The intro sets the
// story and checks the mic is usable before the run.

import { Link, useNavigate } from 'react-router-dom'
import { Blaze } from '../components/Blaze'
import { useProfile } from '../profile/store'
import { DIAGNOSTIC_WORDS } from '../diagnostic/diagnosticWords'

export function TeachBlazeIntro() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const dragon = profile.dragonName.trim() || 'Blaze'
  const name = profile.childName.trim() || 'you'

  const speechSupported =
    typeof window !== 'undefined' &&
    !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)

  return (
    <div className="intro">
      <div className="intro-glow" aria-hidden="true" />
      <Blaze state="waving" size="xl" glow={0.4} />
      <h1 className="intro-title">{dragon} just hatched! 🥚</h1>
      <p className="intro-lead">
        {dragon} doesn't know how to talk yet. When {name} say words out loud, {dragon} learns the
        sounds — and lights up with energy. Ready to teach him his first words?
      </p>

      <div className="intro-steps">
        <div className="intro-step">
          <span className="intro-step-emoji">👀</span>A picture pops up
        </div>
        <div className="intro-step">
          <span className="intro-step-emoji">🎤</span>Say the word once
        </div>
        <div className="intro-step">
          <span className="intro-step-emoji">⚡</span>{dragon} fills with energy
        </div>
      </div>

      {speechSupported ? (
        <>
          <button className="btn-coral btn-pressable intro-start" onClick={() => navigate('/diagnostic')}>
            I'm ready — teach {dragon}! 🐲
          </button>
          <p className="intro-fine">
            About {DIAGNOSTIC_WORDS.length} quick words · one try each · stop any time
          </p>
        </>
      ) : (
        <div className="intro-warn card-tactile">
          <p>
            🔌 This adventure needs the browser's speech recogniser (Chrome or Edge on desktop /
            Android). Your browser doesn't support it, so {dragon}'s first-words screen can't run
            here.
          </p>
          <Link to="/practice" className="btn-teal btn-pressable">
            Go to practice instead →
          </Link>
        </div>
      )}

      <Link to="/" className="intro-skip">
        Maybe later
      </Link>
    </div>
  )
}

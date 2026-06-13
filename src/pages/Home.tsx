// Home.tsx — The hub. Greets the child + Blaze, shows today's goal, and offers the
// three doors: teach Blaze (diagnostic), practice (the Coach), and the grown-up
// progress view. A "today's words" rail is reordered by the diagnostic's priority
// sounds so the child starts where it matters.

import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../profile/store'
import { Blaze } from '../components/Blaze'
import { WORDS } from '../speech/words'
import { toIpaToken } from '../speech/phonemeTokens'

export function Home() {
  const navigate = useNavigate()
  const { profile, dailyGoal, needsDiagnostic } = useProfile()
  const name = profile.childName.trim() || 'friend'
  const dragon = profile.dragonName.trim() || 'Blaze'

  // Order practice words so priority sounds (from the diagnostic) come first.
  const words = useMemo(() => {
    const priority = new Set(profile.priorityPhonemes)
    const avoid = new Set(profile.avoidPhonemes)
    return [...WORDS].sort((a, b) => {
      const rank = (w: (typeof WORDS)[number]) => {
        const ipa = w.phonemes.map(toIpaToken)
        if (ipa.some((p) => priority.has(p))) return 0
        if (ipa.some((p) => avoid.has(p))) return 2
        return 1
      }
      return rank(a) - rank(b)
    })
  }, [profile.priorityPhonemes, profile.avoidPhonemes])

  return (
    <div className="home">
      <section className="home-hero card-tactile">
        <Blaze state="idle" size="lg" />
        <div className="home-hero-text">
          <h1 className="home-greeting">Hi {name}! 👋</h1>
          <p className="home-tagline">
            {dragon} is ready to practise. Today's goal: <strong>{dailyGoal} words</strong>.
          </p>
        </div>
      </section>

      {needsDiagnostic && (
        <Link to="/teach-blaze" className="home-banner btn-pressable">
          <span className="home-banner-emoji">🥚</span>
          <span>
            <strong>Teach {dragon} his first words</strong>
            <br />A quick, playful warm-up that finds {name}'s sounds.
          </span>
          <span className="home-banner-go">→</span>
        </Link>
      )}

      <div className="home-doors">
        <button className="door door--teal btn-pressable" onClick={() => navigate('/practice')}>
          <span className="door-emoji">🎤</span>
          <span className="door-title">Practise words</span>
          <span className="door-sub">Say it, see the wave, win stars</span>
        </button>

        <button className="door door--coral btn-pressable" onClick={() => navigate('/teach-blaze')}>
          <span className="door-emoji">🐲</span>
          <span className="door-title">Teach {dragon}</span>
          <span className="door-sub">The first-words adventure</span>
        </button>

        <Link to="/dashboard" className="door door--cream btn-pressable">
          <span className="door-emoji">📊</span>
          <span className="door-title">Grown-up progress</span>
          <span className="door-sub">Charts, sounds & therapy summary</span>
        </Link>
      </div>

      <section className="home-rail">
        <h2 className="home-rail-title">Today's words</h2>
        <div className="home-rail-track">
          {words.map((w) => {
            const priority = w.phonemes
              .map(toIpaToken)
              .some((p) => profile.priorityPhonemes.includes(p))
            return (
              <button
                key={w.id}
                className={`rail-word tile-wood btn-pressable${priority ? ' rail-word--priority' : ''}`}
                onClick={() => navigate(`/practice/${w.id}`)}
              >
                <span className="rail-word-emoji">{w.emoji}</span>
                <span className="rail-word-label">{w.word}</span>
                <span className="rail-word-sound">{w.focusLabel}</span>
                {priority && <span className="rail-word-flag">focus</span>}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

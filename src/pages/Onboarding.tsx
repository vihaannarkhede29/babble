// Onboarding.tsx — First-run flow: meet Blaze, tell us about the child, optionally
// flag tricky sounds, and set a parent PIN. Adapted from the partner's onboarding
// (Tailwind/Framer → our plain-CSS warm theme + profile store). Finishes into the
// "Teach Blaze his first words" diagnostic.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Blaze } from '../components/Blaze'
import { profileStore } from '../profile/store'
import {
  AGE_QUICK_PICKS,
  CHALLENGING_SOUND_OPTIONS,
  DEFAULT_DRAGON_NAME,
  SESSION_LENGTH_OPTIONS,
} from '../profile/profile'

const STEPS = ['welcome', 'child', 'sounds', 'pin'] as const

export function Onboarding() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const [childName, setChildName] = useState('')
  const [dragonName, setDragonName] = useState(DEFAULT_DRAGON_NAME)
  const [age, setAge] = useState(5)
  const [sessionLengthMinutes, setSession] = useState(10)
  const [hasSounds, setHasSounds] = useState(false)
  const [challengingSounds, setChallenging] = useState<string[]>([])
  const [pin, setPin] = useState('')

  const dragon = dragonName.trim() || DEFAULT_DRAGON_NAME

  const canContinue = () => {
    if (step === 'child') return childName.trim().length > 0
    if (step === 'sounds') return !hasSounds || challengingSounds.length > 0
    if (step === 'pin') return pin.length === 0 || pin.length === 4
    return true
  }

  const finish = (go: string) => {
    profileStore.completeOnboarding({
      childName,
      dragonName: dragon,
      age,
      sessionLengthMinutes,
      challengingSounds: hasSounds ? challengingSounds : [],
      parentPin: pin.length === 4 ? pin : null,
    })
    navigate(go)
  }

  const next = () => {
    if (!canContinue()) return
    if (stepIndex === STEPS.length - 1) {
      finish('/teach-blaze')
      return
    }
    setStepIndex((i) => i + 1)
  }

  const toggleSound = (s: string) =>
    setChallenging((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  return (
    <div className="onb">
      <div className="onb-dots">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`onb-dot${i === stepIndex ? ' onb-dot--active' : ''}${i < stepIndex ? ' onb-dot--done' : ''}`}
          />
        ))}
      </div>

      <div className="onb-body" key={step}>
        {step === 'welcome' && (
          <div className="onb-center">
            <Blaze state="waving" size="xl" />
            <h1 className="onb-h1">Meet {dragon}! 🥚→🐲</h1>
            <p className="onb-lead">
              {dragon} is a just-hatched dragon who doesn't know how to talk yet. Your child will
              <strong> teach {dragon} to speak</strong> — and learn their sounds along the way.
            </p>
          </div>
        )}

        {step === 'child' && (
          <div className="onb-form">
            <div className="onb-head">
              <Blaze state="listening" size="sm" />
              <div>
                <h1 className="onb-h2">Who's teaching {dragon}?</h1>
                <p className="onb-sub">We'll personalise the practice.</p>
              </div>
            </div>

            <label className="field">
              <span className="field-label">Child's name</span>
              <input
                className="field-input"
                autoFocus
                placeholder="e.g. Mia"
                value={childName}
                maxLength={24}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
              />
            </label>

            <label className="field">
              <span className="field-label">Name your dragon</span>
              <input
                className="field-input"
                placeholder={DEFAULT_DRAGON_NAME}
                value={dragonName}
                maxLength={16}
                onChange={(e) => setDragonName(e.target.value)}
              />
            </label>

            <div className="field">
              <span className="field-label">Age</span>
              <div className="chip-row">
                {AGE_QUICK_PICKS.map((a) => (
                  <button
                    key={a}
                    className={`chip${age === a ? ' chip--active' : ''}`}
                    onClick={() => setAge(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'sounds' && (
          <div className="onb-form">
            <div className="onb-head">
              <Blaze state="idle" size="sm" />
              <div>
                <h1 className="onb-h2">Any tricky sounds?</h1>
                <p className="onb-sub">Optional — helps us start gentle.</p>
              </div>
            </div>

            <p className="onb-note">
              If a speech therapist has flagged certain sounds, we'll hold off on them at first and
              build confidence with easier words. You can skip this — the next step (teaching {dragon})
              figures sounds out automatically.
            </p>

            <label className="toggle-row">
              <input type="checkbox" checked={hasSounds} onChange={(e) => setHasSounds(e.target.checked)} />
              <span>A grown-up has flagged specific sounds</span>
            </label>

            {hasSounds && (
              <div className="chip-row chip-row--wrap">
                {CHALLENGING_SOUND_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`chip${challengingSounds.includes(s) ? ' chip--active' : ''}`}
                    onClick={() => toggleSound(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="field">
              <span className="field-label">Session length</span>
              <div className="chip-row">
                {SESSION_LENGTH_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    className={`chip${sessionLengthMinutes === o.value ? ' chip--active' : ''}`}
                    onClick={() => setSession(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="onb-form">
            <div className="onb-head">
              <Blaze state="celebrating" size="sm" />
              <div>
                <h1 className="onb-h2">Set a parent PIN</h1>
                <p className="onb-sub">Optional — gates the grown-up dashboard.</p>
              </div>
            </div>

            <label className="field">
              <span className="field-label">4-digit PIN (leave blank to skip)</span>
              <input
                className="field-input field-input--pin"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </label>

            <div className="onb-ready card-tactile">
              <p className="onb-ready-title">Ready for {childName.trim() || 'your child'}!</p>
              <p className="onb-ready-sub">
                Next, {childName.trim() || 'they'}'ll teach {dragon} his first words — a quick, playful
                way to hear which sounds are solid and which need love.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="onb-actions">
        {stepIndex > 0 && (
          <button className="btn-ghost btn-pressable" onClick={() => setStepIndex((i) => i - 1)}>
            Back
          </button>
        )}
        <button
          className="btn-teal btn-pressable onb-next"
          disabled={!canContinue()}
          onClick={next}
        >
          {step === 'pin' ? `Teach ${dragon}! 🐲` : 'Continue'}
        </button>
      </div>

      {step === 'pin' && (
        <button className="onb-skip" onClick={() => finish('/')}>
          Skip for now — go to the home screen
        </button>
      )}
    </div>
  )
}

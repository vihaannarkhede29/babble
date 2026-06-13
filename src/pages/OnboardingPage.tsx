import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragonCompanion } from '../components/dragon/DragonCompanion'
import { DragonAchievementsIntro } from '../components/onboarding/DragonAchievementsIntro'
import { DragonWelcomeIntro } from '../components/onboarding/DragonWelcomeIntro'
import { ProfileFormFields } from '../components/onboarding/ProfileFormFields'
import { useChildProfile } from '../hooks/useChildProfile'
import { DEFAULT_DRAGON_NAME, type ChildProfile } from '../lib/profile'

const STEPS = ['welcome', 'profile', 'achievements', 'sounds', 'session'] as const
type Step = (typeof STEPS)[number]

const stepTitles: Record<Step, string> = {
  welcome: 'Meet your dragon!',
  profile: 'Tell us about your child',
  achievements: "Here's what you can achieve",
  sounds: 'Speech sounds',
  session: 'Session length',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useChildProfile()
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<ChildProfile>({
    childName: '',
    dragonName: DEFAULT_DRAGON_NAME,
    age: 5,
    hasIdentifiedSounds: false,
    challengingSounds: [],
    sessionLengthMinutes: 10,
    onboardingComplete: false,
    diagnosticComplete: false,
  })

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const isWelcome = step === 'welcome'
  const isAchievements = step === 'achievements'
  const isCleanStep = isWelcome || isAchievements
  const dragonName = draft.dragonName.trim() || DEFAULT_DRAGON_NAME

  const updateDraft = (updates: Partial<ChildProfile>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }

  const canContinue = () => {
    if (step === 'welcome') return true
    if (step === 'profile') return draft.childName.trim().length > 0
    if (step === 'achievements') return true
    if (step === 'sounds') {
      if (!draft.hasIdentifiedSounds) return true
      return draft.challengingSounds.length > 0
    }
    return true
  }

  const handleNext = () => {
    if (!canContinue()) return

    if (isLastStep) {
      completeOnboarding({
        ...draft,
        dragonName,
        childName: draft.childName.trim(),
      })
      navigate('/teach-blaze')
      return
    }

    setStepIndex((i) => i + 1)
  }

  const handleBack = () => {
    if (stepIndex === 0) return
    setStepIndex((i) => i - 1)
  }

  return (
    <div
      className={[
        'mx-auto flex min-h-svh max-w-md flex-col px-4 py-6',
        isCleanStep ? 'bg-white' : '',
      ].join(' ')}
    >
      {!isWelcome && (
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={[
                'h-2 rounded-full transition-all',
                index === stepIndex ? 'w-8 bg-dragon-teal' : 'w-2 bg-forest/20',
                index < stepIndex ? 'bg-dragon-teal/60' : '',
              ].join(' ')}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: isCleanStep ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isCleanStep ? 0 : -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 flex-col"
        >
          {step === 'welcome' && <DragonWelcomeIntro dragonName={dragonName} />}

          {step === 'profile' && (
            <div className="flex flex-1 flex-col gap-6">
              <div className="flex items-center gap-4">
                <DragonCompanion state="listening" size="sm" />
                <div>
                  <h1 className="text-2xl font-black text-forest">{stepTitles[step]}</h1>
                  <p className="text-sm font-semibold text-forest/70">
                    We&apos;ll personalize the experience.
                  </p>
                </div>
              </div>
              <ProfileFormFields
                profile={draft}
                onChange={updateDraft}
                showNameFields
                showAge
                showSounds={false}
                showSession={false}
              />
            </div>
          )}

          {step === 'achievements' && (
            <DragonAchievementsIntro
              dragonName={dragonName}
              childName={draft.childName}
            />
          )}

          {step === 'sounds' && (
            <div className="flex flex-1 flex-col gap-6">
              <div>
                <h1 className="text-2xl font-black text-forest">{stepTitles[step]}</h1>
                <p className="mt-2 text-sm font-semibold text-forest/70">
                  If a speech therapist has flagged certain sounds, we&apos;ll start with easier
                  words first.
                </p>
              </div>
              <ProfileFormFields
                profile={draft}
                onChange={updateDraft}
                showNameFields={false}
                showAge={false}
                showSounds
                showSession={false}
              />
            </div>
          )}

          {step === 'session' && (
            <div className="flex flex-1 flex-col gap-6">
              <div className="flex items-center gap-4">
                <DragonCompanion state="celebrating" size="sm" />
                <div>
                  <h1 className="text-2xl font-black text-forest">{stepTitles[step]}</h1>
                  <p className="text-sm font-semibold text-forest/70">
                    Short, focused sessions work best for young learners.
                  </p>
                </div>
              </div>
              <ProfileFormFields
                profile={draft}
                onChange={updateDraft}
                showNameFields={false}
                showAge={false}
                showSounds={false}
                showSession
              />
              <div className="rounded-2xl bg-white p-4 text-left shadow-md">
                <p className="text-sm font-bold text-forest">Ready for {draft.childName}!</p>
                <p className="mt-1 text-sm text-forest/70">
                  {dragonName} will practice about {draft.sessionLengthMinutes} minutes at a time,
                  starting with confidence-building words
                  {draft.challengingSounds.length > 0
                    ? ` (holding off on ${draft.challengingSounds.join(', ')} sounds for now)`
                    : ''}
                  .
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className={`mt-8 flex gap-3 ${isCleanStep ? 'pb-4' : ''}`}>
        {stepIndex > 0 && (
          <button
            type="button"
            className="btn-pressable flex-1 rounded-xl bg-white py-4 font-bold text-forest shadow-md"
            onClick={handleBack}
          >
            Back
          </button>
        )}
        <button
          type="button"
          disabled={!canContinue()}
          className={[
            'btn-pressable rounded-xl py-4 font-black shadow-md',
            stepIndex > 0 ? 'flex-1' : 'w-full',
            canContinue()
              ? isCleanStep
                ? 'bg-dragon-teal text-white'
                : 'bg-forest text-cloud'
              : 'cursor-not-allowed bg-forest/30 text-cloud/70',
          ].join(' ')}
          onClick={handleNext}
        >
          {isLastStep ? 'Start practicing!' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

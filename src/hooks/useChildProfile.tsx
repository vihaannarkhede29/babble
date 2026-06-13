/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type ChildProfile,
  dailyGoalFromSession,
  defaultProfile,
  getWordsForProfile,
} from '../lib/profile'

interface ChildProfileContextValue {
  profile: ChildProfile
  updateProfile: (updates: Partial<ChildProfile>) => void
  completeOnboarding: (updates: Partial<ChildProfile>) => void
  completeDiagnostic: () => void
  resetOnboarding: () => void
  recommendedWords: ReturnType<typeof getWordsForProfile>['recommended']
  deprioritizedWords: ReturnType<typeof getWordsForProfile>['deprioritized']
  dailyGoal: number
  isOnboarded: boolean
  needsDiagnostic: boolean
}

const ChildProfileContext = createContext<ChildProfileContextValue | null>(null)

export function ChildProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile)

  const updateProfile = useCallback((updates: Partial<ChildProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }, [])

  const completeOnboarding = useCallback((updates: Partial<ChildProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
      onboardingComplete: true,
      diagnosticComplete: false,
    }))
  }, [])

  const completeDiagnostic = useCallback(() => {
    setProfile((prev) => ({ ...prev, diagnosticComplete: true }))
  }, [])

  const resetOnboarding = useCallback(() => {
    setProfile(defaultProfile)
  }, [])

  const { recommended, deprioritized } = getWordsForProfile(profile)
  const dailyGoal = dailyGoalFromSession(profile.sessionLengthMinutes)
  const isOnboarded = profile.onboardingComplete && profile.childName.trim().length > 0
  const needsDiagnostic = isOnboarded && !profile.diagnosticComplete

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      completeOnboarding,
      completeDiagnostic,
      resetOnboarding,
      recommendedWords: recommended,
      deprioritizedWords: deprioritized,
      dailyGoal,
      isOnboarded,
      needsDiagnostic,
    }),
    [
      profile,
      updateProfile,
      completeOnboarding,
      completeDiagnostic,
      resetOnboarding,
      recommended,
      deprioritized,
      dailyGoal,
      isOnboarded,
      needsDiagnostic,
    ],
  )

  return (
    <ChildProfileContext.Provider value={value}>{children}</ChildProfileContext.Provider>
  )
}

export function useChildProfile() {
  const context = useContext(ChildProfileContext)
  if (!context) {
    throw new Error('useChildProfile must be used within ChildProfileProvider')
  }
  return context
}

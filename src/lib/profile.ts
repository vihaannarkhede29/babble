import type { Word } from './words'
import { WORDS } from './words'

export interface ChildProfile {
  childName: string
  dragonName: string
  age: number
  hasIdentifiedSounds: boolean
  challengingSounds: string[]
  sessionLengthMinutes: number
  onboardingComplete: boolean
  diagnosticComplete: boolean
}

export const DEFAULT_DRAGON_NAME = 'Blaze'

export const AGE_MIN = 2
export const AGE_MAX = 12

export const AGE_QUICK_PICKS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export const SESSION_MIN_MINUTES = 3
export const SESSION_MAX_MINUTES = 45

export const SESSION_LENGTH_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: '3 min' },
  { value: 5, label: '5 min' },
  { value: 8, label: '8 min' },
  { value: 10, label: '10 min' },
  { value: 12, label: '12 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
]

export function clampAge(value: number): number {
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(value)))
}

export function clampSessionMinutes(value: number): number {
  return Math.min(SESSION_MAX_MINUTES, Math.max(SESSION_MIN_MINUTES, Math.round(value)))
}

export const CHALLENGING_SOUND_OPTIONS = ['R', 'TH', 'S', 'L', 'SH', 'CH'] as const

export type ChallengingSound = (typeof CHALLENGING_SOUND_OPTIONS)[number]

export const defaultProfile: ChildProfile = {
  childName: '',
  dragonName: DEFAULT_DRAGON_NAME,
  age: 5,
  hasIdentifiedSounds: false,
  challengingSounds: [],
  sessionLengthMinutes: 10,
  onboardingComplete: false,
  diagnosticComplete: false,
}

export function dailyGoalFromSession(minutes: number): number {
  const m = clampSessionMinutes(minutes)
  if (m <= 3) return 1
  if (m <= 5) return 2
  if (m <= 8) return 3
  if (m <= 10) return 5
  if (m <= 12) return 6
  if (m <= 15) return 7
  if (m <= 20) return 8
  if (m <= 25) return 9
  return 10
}

export function wordContainsChallengingSound(word: Word, sounds: string[]): boolean {
  if (sounds.length === 0) return false
  return word.containsSounds.some((sound) =>
    sounds.some((target) => sound.toUpperCase() === target.toUpperCase()),
  )
}

export function getWordsForProfile(profile: ChildProfile): {
  recommended: Word[]
  deprioritized: Word[]
} {
  const challenging =
    profile.hasIdentifiedSounds && profile.challengingSounds.length > 0
      ? profile.challengingSounds
      : []

  const recommended: Word[] = []
  const deprioritized: Word[] = []

  for (const word of WORDS) {
    if (wordContainsChallengingSound(word, challenging)) {
      deprioritized.push(word)
    } else {
      recommended.push(word)
    }
  }

  const difficultyOrder = { easy: 0, medium: 1, hard: 2 }
  const sorter = (a: Word, b: Word) =>
    difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]

  return {
    recommended: recommended.sort(sorter),
    deprioritized: deprioritized.sort(sorter),
  }
}

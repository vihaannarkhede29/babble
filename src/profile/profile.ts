// profile.ts — The child profile: who's practising, their dragon, and the
// personalization the "Teach Blaze" diagnostic writes back.
//
// Adapted from the partner shell's profile model, with three changes for our
// build: (1) a parent PIN for the grown-up gate, (2) diagnostic-derived phoneme
// lists (IPA tokens our engine understands), and (3) localStorage persistence
// (see ./store), since the partner's profile was in-memory only.

export interface ChildProfile {
  childName: string
  dragonName: string
  age: number
  /** 4-digit parent gate. null = not set yet (gate passes through with a nudge). */
  parentPin: string | null
  /** Parent-reported tricky sounds (ARPABET-ish: R, TH, S, L, SH, CH). */
  challengingSounds: string[]
  sessionLengthMinutes: number
  onboardingComplete: boolean
  diagnosticComplete: boolean

  // --- Written by the diagnostic (IPA tokens, e.g. 'ʃ', 'r', 'θ') ---
  /** Sounds to work on next (heard unclearly in the screener). */
  priorityPhonemes: string[]
  /** Sounds the child already produces clearly. */
  masteredPhonemes: string[]
  /** Sounds to hold off on early (parent-flagged hard sounds). */
  avoidPhonemes: string[]
}

export const DEFAULT_DRAGON_NAME = 'Blaze'

export const AGE_MIN = 2
export const AGE_MAX = 12
export const AGE_QUICK_PICKS = [3, 4, 5, 6, 7, 8] as const

export const CHALLENGING_SOUND_OPTIONS = ['R', 'TH', 'S', 'L', 'SH', 'CH'] as const
export type ChallengingSound = (typeof CHALLENGING_SOUND_OPTIONS)[number]

export const SESSION_LENGTH_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: '3 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
]

export const defaultProfile: ChildProfile = {
  childName: '',
  dragonName: DEFAULT_DRAGON_NAME,
  age: 5,
  parentPin: null,
  challengingSounds: [],
  sessionLengthMinutes: 10,
  onboardingComplete: false,
  diagnosticComplete: false,
  priorityPhonemes: [],
  masteredPhonemes: [],
  avoidPhonemes: [],
}

export function clampAge(value: number): number {
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(value)))
}

/** A gentle daily word goal derived from the chosen session length. */
export function dailyGoalFromSession(minutes: number): number {
  if (minutes <= 3) return 1
  if (minutes <= 5) return 3
  if (minutes <= 10) return 5
  return 8
}

/** Merge a possibly-partial stored object onto defaults (forward-compatible load). */
export function normalizeProfile(raw: Partial<ChildProfile> | null | undefined): ChildProfile {
  if (!raw || typeof raw !== 'object') return { ...defaultProfile }
  return {
    ...defaultProfile,
    ...raw,
    challengingSounds: Array.isArray(raw.challengingSounds) ? raw.challengingSounds : [],
    priorityPhonemes: Array.isArray(raw.priorityPhonemes) ? raw.priorityPhonemes : [],
    masteredPhonemes: Array.isArray(raw.masteredPhonemes) ? raw.masteredPhonemes : [],
    avoidPhonemes: Array.isArray(raw.avoidPhonemes) ? raw.avoidPhonemes : [],
  }
}

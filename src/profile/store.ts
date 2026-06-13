// store.ts — The child profile as an external store (subscribe / getSnapshot),
// mirroring game/store.ts so components bind with useSyncExternalStore. Persisted
// to localStorage so onboarding + diagnostic results survive reloads.

import { useSyncExternalStore } from 'react'
import {
  type ChildProfile,
  dailyGoalFromSession,
  defaultProfile,
  normalizeProfile,
} from './profile'

const STORAGE_KEY = 'phonicsforge.profile.v1'

function loadInitial(): ChildProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeProfile(JSON.parse(raw))
  } catch {
    // Corrupt / unavailable storage — start fresh.
  }
  return { ...defaultProfile }
}

function persist(data: ChildProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Private mode / full storage — session still works, just not persisted.
  }
}

let state: ChildProfile = loadInitial()
const listeners = new Set<() => void>()

function set(next: ChildProfile): void {
  state = next
  persist(state)
  for (const l of listeners) l()
}

/** The personalization payload the diagnostic writes when it finishes. */
export interface DiagnosticConfig {
  priorityPhonemes: string[]
  masteredPhonemes: string[]
  avoidPhonemes: string[]
}

export const profileStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot(): ChildProfile {
    return state
  },
  update(updates: Partial<ChildProfile>): void {
    set({ ...state, ...updates })
  },
  completeOnboarding(updates: Partial<ChildProfile>): void {
    set({
      ...state,
      ...updates,
      childName: (updates.childName ?? state.childName).trim(),
      onboardingComplete: true,
    })
  },
  completeDiagnostic(config: DiagnosticConfig): void {
    set({
      ...state,
      ...config,
      diagnosticComplete: true,
    })
  },
  setPin(pin: string | null): void {
    set({ ...state, parentPin: pin })
  },
  reset(): void {
    set({ ...defaultProfile })
  },
}

export interface UseProfile {
  profile: ChildProfile
  dailyGoal: number
  isOnboarded: boolean
  needsDiagnostic: boolean
}

export function useProfile(): UseProfile {
  const profile = useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot)
  const isOnboarded = profile.onboardingComplete && profile.childName.trim().length > 0
  return {
    profile,
    dailyGoal: dailyGoalFromSession(profile.sessionLengthMinutes),
    isOnboarded,
    needsDiagnostic: isOnboarded && !profile.diagnosticComplete,
  }
}

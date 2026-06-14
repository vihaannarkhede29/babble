// customWords.ts — Turn a typed word into a practice item, persisted locally.
//
// We store just the typed strings in localStorage and rebuild the PracticeWord
// (breakdown + focus) on load, so the g2p rules can improve without migrating
// saved data.

import type { PracticeWord } from './words'
import { wordToPhonemes } from './g2p'
import { articulationFor } from './articulation'

const STORAGE_KEY = 'babble.customwords.v1'

/** Map a focus IPA token onto a built-in phoneme id when it matches one, so the
 *  dashboard/mastery keeps working; otherwise keep the token (still earns XP). */
const PHONEME_ID: Record<string, string> = {
  s: 's', 'ʃ': 'sh', 'iː': 'iy', 'ɛ': 'eh', 'æ': 'ae', 'ɑː': 'aa', 'oʊ': 'ow', 'uː': 'uw',
}

/** Build a PracticeWord from raw user input, or null if it isn't a usable word. */
export function buildCustomWord(input: string): PracticeWord | null {
  const word = input.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length < 2) return null
  const { phonemes, focusIndex } = wordToPhonemes(word)
  const focusTok = phonemes[focusIndex] ?? phonemes[0] ?? 'ʌ'
  return {
    id: `custom:${word}`,
    word,
    emoji: '🗣️',
    focusPhonemeId: PHONEME_ID[focusTok] ?? focusTok,
    focusLabel: articulationFor(focusTok).label,
    phonemes,
    focusIndex,
    accept: [],
    nearMiss: [],
  }
}

export function loadCustomInputs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    // ignore
  }
  return []
}

export function saveCustomInputs(words: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  } catch {
    // ignore
  }
}

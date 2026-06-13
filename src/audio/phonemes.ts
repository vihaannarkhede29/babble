// phonemes.ts — The catalogue of target sounds and the maths that maps an
// acoustic measurement into the "vowel space" the rest of the app reasons about.
//
// VOWEL SPACE
// -----------
// Linguists plot vowels on a 2-D chart whose axes are the first two formants.
// F1 (≈250–850 Hz) is inversely related to tongue/jaw *height*: a low F1 means
// a high, closed tongue (/iː/, /uː/); a high F1 means an open mouth (/ɑː/).
// F2 (≈800–2400 Hz) tracks tongue *frontness*: high F2 is front (/iː/), low F2
// is back (/uː/). Because those two numbers also describe how to *position* the
// mouth, the same coordinates drive both the score and the animated diagram.
//
// Reference formant values below are the classic adult-male means from
// Peterson & Barney (1952). Children's formants are higher (shorter vocal
// tract); the scorer normalises to *relative* position so an adult judge and a
// 5-year-old both land in the right region. Per-speaker calibration is the
// production refinement (see ARCHITECTURE.md).

import type { Phoneme, VowelPoint } from '../lib/types'

// Bounds of the formant ranges we normalise against (Hz).
const F1_MIN = 250
const F1_MAX = 850
const F2_MIN = 800
const F2_MAX = 2400

/** Map raw (F1, F2) in Hz onto a 0..1 × 0..1 vowel-space point. */
export function formantToVowel(f1: number, f2: number): VowelPoint {
  const open = clamp01((f1 - F1_MIN) / (F1_MAX - F1_MIN)) // high F1 → open
  const front = clamp01((f2 - F2_MIN) / (F2_MAX - F2_MIN)) // high F2 → front
  return { open, front }
}

/** The same mapping applied to a phoneme target, so target & live share axes. */
export function targetVowel(p: Phoneme): VowelPoint {
  return formantToVowel(p.f1, p.f2)
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/**
 * The MVP practice set.
 *
 * Six vowels chosen to span the corners of the vowel space (so the live marker
 * visibly jumps between sounds), plus the /s/–/ʃ/ sibilant contrast — the
 * single most common articulation target in early speech therapy ("s" lisps).
 * Vowels are scored on formants; sibilants on spectral centroid.
 */
export const PHONEMES: Phoneme[] = [
  {
    id: 'iy',
    ipa: 'iː',
    grapheme: 'ee',
    label: 'EE',
    exampleWord: 'sheep',
    emoji: '🐑',
    mode: 'formant',
    f1: 270,
    f2: 2290,
    tongueHeight: 0.95,
    tongueFront: 0.95,
    lipRounding: 0.05,
    jawOpen: 0.15,
  },
  {
    id: 'eh',
    ipa: 'ɛ',
    grapheme: 'e',
    label: 'EH',
    exampleWord: 'red',
    emoji: '🛑',
    mode: 'formant',
    f1: 530,
    f2: 1840,
    tongueHeight: 0.55,
    tongueFront: 0.7,
    lipRounding: 0.1,
    jawOpen: 0.5,
  },
  {
    id: 'ae',
    ipa: 'æ',
    grapheme: 'a',
    label: 'AA',
    exampleWord: 'cat',
    emoji: '🐱',
    mode: 'formant',
    f1: 660,
    f2: 1720,
    tongueHeight: 0.3,
    tongueFront: 0.6,
    lipRounding: 0.1,
    jawOpen: 0.75,
  },
  {
    id: 'aa',
    ipa: 'ɑː',
    grapheme: 'ah',
    label: 'AH',
    exampleWord: 'car',
    emoji: '🚗',
    mode: 'formant',
    f1: 730,
    f2: 1090,
    tongueHeight: 0.1,
    tongueFront: 0.15,
    lipRounding: 0.15,
    jawOpen: 0.95,
  },
  {
    id: 'ow',
    ipa: 'oʊ',
    grapheme: 'oh',
    label: 'OH',
    exampleWord: 'boat',
    emoji: '⛵',
    mode: 'formant',
    f1: 570,
    f2: 840,
    tongueHeight: 0.45,
    tongueFront: 0.1,
    lipRounding: 0.8,
    jawOpen: 0.5,
  },
  {
    id: 'uw',
    ipa: 'uː',
    grapheme: 'oo',
    label: 'OO',
    exampleWord: 'moon',
    emoji: '🌙',
    mode: 'formant',
    f1: 300,
    f2: 870,
    tongueHeight: 0.9,
    tongueFront: 0.1,
    lipRounding: 0.95,
    jawOpen: 0.2,
  },
  {
    id: 's',
    ipa: 's',
    grapheme: 's',
    label: 'SSS',
    exampleWord: 'snake',
    emoji: '🐍',
    mode: 'sibilant',
    f1: 0,
    f2: 0,
    centroidTarget: 6500, // bright, high-frequency hiss
    tongueHeight: 0.85,
    tongueFront: 0.9,
    lipRounding: 0.1,
    jawOpen: 0.1,
  },
  {
    id: 'sh',
    ipa: 'ʃ',
    grapheme: 'sh',
    label: 'SH',
    exampleWord: 'ship',
    emoji: '🚢',
    mode: 'sibilant',
    f1: 0,
    f2: 0,
    centroidTarget: 3500, // duller, lower-frequency hush
    tongueHeight: 0.7,
    tongueFront: 0.6,
    lipRounding: 0.4,
    jawOpen: 0.15,
  },
]

/** Look a phoneme up by id (used when replaying seeded history). */
export function getPhoneme(id: string): Phoneme | undefined {
  return PHONEMES.find((p) => p.id === id)
}

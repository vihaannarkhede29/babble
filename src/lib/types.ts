// Shared domain types for PhonicsForge.
//
// The data flows in one direction:
//   raw mic samples  ->  AcousticFrame (dsp.ts)  ->  ScoreResult (scorer.ts)  ->  UI
// Keeping these types in one place makes that pipeline easy to follow.

/** One analysis window's worth of acoustic features, all measured on-device. */
export interface AcousticFrame {
  /** Root-mean-square amplitude, ~0 (silence) .. ~1 (loud). Used to gate analysis. */
  rms: number
  /** True when there is enough energy in the window to bother analysing it. */
  voiced: boolean
  /**
   * Voicing confidence, 0..1: the normalized autocorrelation peak in the human
   * pitch range. High for periodic (voiced) speech, low for aperiodic noise —
   * this is what lets us reject background noise instead of scoring it.
   */
  periodicity: number
  /** Fundamental frequency (pitch) in Hz, 0 when unvoiced. */
  f0: number
  /** Zero-crossing rate, 0..1. High for fricatives (/s/, /ʃ/), low for vowels. */
  zcr: number
  /** Spectral centroid in Hz — the "brightness" of the sound. Separates /s/ from /ʃ/. */
  centroid: number
  /** First formant (Hz). Tracks tongue *height* / jaw openness. 0 when unvoiced. */
  f1: number
  /** Second formant (Hz). Tracks tongue *frontness* and lip rounding. 0 when unvoiced. */
  f2: number
}

/** How a phoneme is scored: vowels use formants, sibilants use spectral shape. */
export type ScoreMode = 'formant' | 'sibilant'

/** A target sound the child practises. */
export interface Phoneme {
  id: string // stable key, e.g. 'iy'
  ipa: string // 'iː'
  grapheme: string // the letters that spell it, 'ee'
  label: string // big friendly label, 'EE'
  exampleWord: string // 'sheep'
  /** Substring of exampleWord to highlight, when it differs from `grapheme`. */
  wordTarget?: string
  emoji: string // shown on the card
  mode: ScoreMode

  // --- Acoustic target (reference adult formants, Hz; Peterson & Barney 1952) ---
  f1: number
  f2: number
  /** For sibilants: target spectral centroid (Hz). */
  centroidTarget?: number

  // --- Articulation parameters (0..1) that drive the procedural mouth diagram ---
  tongueHeight: number // 1 = high/close, 0 = low/open
  tongueFront: number // 1 = front, 0 = back
  lipRounding: number // 1 = rounded, 0 = spread
  jawOpen: number // 1 = wide open, 0 = closed
}

/** Normalized position in the 2-D vowel space (what the live marker plots). */
export interface VowelPoint {
  /** 0 = back, 1 = front (derived from F2). */
  front: number
  /** 0 = close/high tongue, 1 = open/low tongue (derived from F1). */
  open: number
}

/** Result of comparing one frame against the active phoneme target. */
export interface ScoreResult {
  /** 0..1 match against the target. */
  accuracy: number
  /** Where the speaker currently is in vowel space (for the live marker). */
  live: VowelPoint
  /** A short, child-friendly correction, e.g. "Open wider!". Empty when on target. */
  hint: string
}

/** A single practice rep, persisted to build the mastery history. */
export interface Attempt {
  phonemeId: string
  /** Best accuracy reached during the rep, 0..100 (percent). */
  score: number
  /** Epoch ms. */
  at: number
}

/** Aggregated, per-phoneme mastery used by the dashboard. */
export interface Mastery {
  phonemeId: string
  attempts: number
  /** Rolling average score 0..100. */
  avg: number
  /** Most recent score 0..100. */
  latest: number
}

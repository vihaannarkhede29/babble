// inference.ts — Turn whole-word recognition results into a per-phoneme screen.
//
// HONESTY NOTE: the Web Speech API gives us word-level transcripts only — it does
// NOT expose per-phoneme confidence. So we do not fabricate a "/ʃ/ = 73%" number.
// Instead we infer at the level the evidence actually supports:
//
//   • A target sound is "clear" if the child said at least one whole screener word
//     containing it correctly (matched, or a high fuzzy score).
//   • It "needs practice" if every word we screened it with came back wrong.
//   • It's "untested" if its words weren't attempted.
//
// A single correct word outranks a miss for that sound: producing the word right
// is strong positive evidence the sound is intact, whereas a missed word is weak
// negative evidence (the vowel, the recogniser, or another sound could be at
// fault). This keeps the screen conservative — it under-flags rather than
// over-flags, which is the right bias for an at-home early screener.

import { DIAGNOSTIC_WORDS } from './diagnosticWords'
import { articulationFor } from '../speech/articulation'
import { phonemeLabel, toIpaToken } from '../speech/phonemeTokens'
import type { DiagnosticConfig } from '../profile/store'

/** One recorded screener attempt (one word, one try). */
export interface DiagAttempt {
  word: string
  /** What the recogniser heard. */
  heard: string
  score: number
  matched: boolean
  /** ARPABET-ish target sounds this word screened for. */
  tests: string[]
  at: number
}

export type PhonemeOutcome = 'clear' | 'unclear' | 'untested'

export interface PhonemeResult {
  /** ARPABET-ish token (e.g. 'SH', 'R', 'TR'). */
  token: string
  /** Our IPA token (e.g. 'ʃ', 'r'). */
  ipa: string
  /** Kid/parent-readable label. */
  label: string
  outcome: PhonemeOutcome
  /** How many screener words for this sound were attempted. */
  attempted: number
  /** How many of those came back clear. */
  clear: number
  /** An example screener word that targets this sound. */
  example: string
}

export interface Recommendation {
  token: string
  label: string
  ipa: string
  cue: string
  example: string
}

export interface DiagnosticSummary {
  wordsAttempted: number
  totalWords: number
  clear: number
  needsPractice: number
  untested: number
}

export interface DiagnosticResult {
  attempts: DiagAttempt[]
  phonemes: PhonemeResult[]
  recommendations: Recommendation[]
  summary: DiagnosticSummary
  config: DiagnosticConfig
  completedAt: number
}

/** A word counts as "clearly produced" when matched or a strong fuzzy score. */
const CLEAR_THRESHOLD = 70
function isClear(a: DiagAttempt): boolean {
  return a.matched || a.score >= CLEAR_THRESHOLD
}

/** Late-developing / harder sounds to hold off on early, if flagged. */
const HARD_TOKENS = new Set(['R', 'TH', 'S', 'Z', 'SH', 'ZH', 'CH', 'J', 'L', 'FR', 'TR', 'DR', 'SL'])

/** Stable list of every sound the screener tests, in first-appearance order. */
function orderedTestTokens(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const w of DIAGNOSTIC_WORDS) {
    for (const t of w.tests) {
      if (!seen.has(t)) {
        seen.add(t)
        out.push(t)
      }
    }
  }
  return out
}

/** Build the per-phoneme screen + recommendations + personalization config. */
export function computeResult(attempts: DiagAttempt[], completedAt: number): DiagnosticResult {
  const byWord = new Map<string, DiagAttempt>()
  for (const a of attempts) byWord.set(a.word, a) // one attempt per word

  const phonemes: PhonemeResult[] = orderedTestTokens().map((token) => {
    const words = DIAGNOSTIC_WORDS.filter((w) => w.tests.includes(token))
    const tries = words.map((w) => byWord.get(w.word)).filter((a): a is DiagAttempt => !!a)
    const clear = tries.filter(isClear).length
    const outcome: PhonemeOutcome =
      tries.length === 0 ? 'untested' : clear > 0 ? 'clear' : 'unclear'
    return {
      token,
      ipa: toIpaToken(token),
      label: phonemeLabel(token),
      outcome,
      attempted: tries.length,
      clear,
      example: words[0]?.word ?? '',
    }
  })

  const needsPractice = phonemes.filter((p) => p.outcome === 'unclear')

  const recommendations: Recommendation[] = needsPractice.slice(0, 6).map((p) => ({
    token: p.token,
    label: p.label,
    ipa: p.ipa,
    cue: articulationFor(p.ipa).cue || `Practise the ${p.label} sound.`,
    example: p.example,
  }))

  // De-duplicate at the IPA level (several tokens can share one IPA target).
  const ipaSet = (list: PhonemeResult[]) => [...new Set(list.map((p) => p.ipa))]
  const config: DiagnosticConfig = {
    priorityPhonemes: ipaSet(needsPractice),
    masteredPhonemes: ipaSet(phonemes.filter((p) => p.outcome === 'clear')),
    avoidPhonemes: ipaSet(needsPractice.filter((p) => HARD_TOKENS.has(p.token))),
  }

  const summary: DiagnosticSummary = {
    wordsAttempted: byWord.size,
    totalWords: DIAGNOSTIC_WORDS.length,
    clear: phonemes.filter((p) => p.outcome === 'clear').length,
    needsPractice: needsPractice.length,
    untested: phonemes.filter((p) => p.outcome === 'untested').length,
  }

  return { attempts, phonemes, recommendations, summary, config, completedAt }
}

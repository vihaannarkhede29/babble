// match.ts — Turn the Speech API's guesses into a 0–100 score + coaching.
//
// The recogniser returns up to N alternative transcripts (we ask for 3), each a
// best-guess of what was said. We compare every heard word against the target
// word with Levenshtein edit distance (a "fuzzy" string match), so "sip" for
// "ship" earns partial credit instead of a flat fail, and we can name the sound
// that slipped. Exact matches and known homophones score 100.

import type { PracticeWord } from './words'

export interface MatchResult {
  /** 0..100 match against the target word. */
  score: number
  /** True for an exact word / accepted-homophone match. */
  matched: boolean
  /** The closest word we think the child actually said. */
  heard: string
  /** Short, child-friendly feedback (empty when matched). */
  feedback: string
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  // Single rolling row keeps it O(min) memory.
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/** Edit-distance similarity in [0,1]: 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max
}

/** Lowercase, strip non-letters, split into candidate words. */
export function normalizeTranscript(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Compare the recogniser's alternatives against the target word. */
export function matchWord(
  alternatives: { transcript: string; confidence: number }[],
  target: PracticeWord,
): MatchResult {
  // Flatten every word the recogniser offered across all alternatives.
  const heardWords = alternatives.flatMap((a) => normalizeTranscript(a.transcript))
  if (heardWords.length === 0) {
    return { score: 0, matched: false, heard: '', feedback: "I didn't catch that — say it loud and clear!" }
  }

  // Best match across all heard words: exact / homophone counts as perfect.
  let best = { sim: -1, word: heardWords[0] }
  for (const w of heardWords) {
    const exact = w === target.word || target.accept.includes(w)
    const sim = exact ? 1 : similarity(w, target.word)
    if (sim > best.sim) best = { sim, word: w }
  }

  const score = Math.round(best.sim * 100)
  const matched = best.sim >= 0.999

  let feedback = ''
  if (!matched) {
    const isKnownMiss = target.nearMiss.includes(best.word)
    if (score >= 60) {
      feedback = isKnownMiss
        ? `So close! I heard “${best.word}”. Listen for the ${target.focusLabel} sound — try “${target.word}”.`
        : `Almost! I heard “${best.word}”. Try “${target.word}” again.`
    } else {
      feedback = `I heard “${best.word}”. Let's say “${target.word}” together — ${target.focusLabel} sound!`
    }
  }

  return { score, matched, heard: best.word, feedback }
}

// seed.ts — Realistic practice history so the dashboard looks alive on first run.
//
// We fabricate ~2 weeks of a pretend learner's sessions. Scores trend upward
// over time (the child is improving), and the two sibilants (/s/, /ʃ/) lag the
// vowels — a deliberately realistic pattern, since "s" sounds are the classic
// late-mastered / lisp-prone target. A seeded PRNG keeps it reproducible so
// demos and screenshots look identical every run.

import type { Attempt } from '../lib/types'
import { PHONEMES } from '../audio/phonemes'

const DAY_MS = 86_400_000

/** mulberry32 — a tiny, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build a deterministic 14-day history that ends "today" (relative to `now`). */
export function buildSeed(now: number = Date.now()): Attempt[] {
  const rng = mulberry32(0xc0ffee)
  const ids = PHONEMES.map((p) => p.id)
  const attempts: Attempt[] = []

  for (let daysAgo = 14; daysAgo >= 1; daysAgo--) {
    const dayStart = now - daysAgo * DAY_MS
    const progress = (14 - daysAgo) / 13 // 0 (oldest) → 1 (most recent)
    const reps = 3 + Math.floor(rng() * 3) // 3–5 reps that day

    for (let k = 0; k < reps; k++) {
      const id = ids[Math.floor(rng() * ids.length)]
      const lagging = id === 's' || id === 'sh'
      const floor = lagging ? 46 : 60
      const ceiling = lagging ? 80 : 93
      const score = Math.round(
        floor + (ceiling - floor) * progress + (rng() * 12 - 6),
      )
      attempts.push({
        phonemeId: id,
        score: clamp(score, 30, 99),
        at: dayStart + k * 1_200_000, // spread reps ~20 min apart
      })
    }
  }
  return attempts
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

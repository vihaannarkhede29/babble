// wordSchedule.ts — Which words show up Today, Tomorrow, and This week.
//
// A deterministic shuffle of the whole WORD pool gives a stable but well-mixed
// rotation; each day slides a small window along it, so the set is fresh daily
// yet identical across reloads of the same day (no jarring re-shuffles). The
// child's own added words are surfaced first in Today.

import { WORDS, type PracticeWord } from './words'

const DAY_MS = 86_400_000
const DAILY_COUNT = 5

/** Deterministic Fisher–Yates over WORDS (fixed seed → stable order). */
function shuffled(): PracticeWord[] {
  const arr = [...WORDS]
  let seed = 0x9e3779b9
  const rng = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const ROTATION = shuffled()

/** Local-day index since epoch (drives the rotation window). */
export function dayIndex(date: Date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / DAY_MS)
}

function windowFor(idx: number, count: number = DAILY_COUNT): PracticeWord[] {
  const out: PracticeWord[] = []
  const start = ((idx * count) % ROTATION.length + ROTATION.length) % ROTATION.length
  for (let k = 0; k < count; k++) out.push(ROTATION[(start + k) % ROTATION.length])
  return out
}

function dedupe(words: PracticeWord[]): PracticeWord[] {
  const seen = new Set<string>()
  return words.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
}

/** Today's words, with the child's own custom words surfaced first. */
export function todaysWords(custom: PracticeWord[] = []): PracticeWord[] {
  return dedupe([...custom, ...windowFor(dayIndex())])
}

export function tomorrowsWords(): PracticeWord[] {
  return windowFor(dayIndex() + 1)
}

/** Union of the next 7 days' windows. */
export function thisWeeksWords(): PracticeWord[] {
  const start = dayIndex()
  const all: PracticeWord[] = []
  for (let d = 0; d < 7; d++) all.push(...windowFor(start + d))
  return dedupe(all)
}

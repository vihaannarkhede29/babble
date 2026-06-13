// store.ts — The offline game state: practice attempts, XP, and the derived
// analytics the dashboard reads. Persisted to localStorage so progress survives
// reloads with zero backend (the brief's "fully offline" requirement).
//
// It is exposed as an external store (subscribe / getSnapshot) so React
// components can bind to it with useSyncExternalStore — no global context, no
// prop-drilling, and a single source of truth.

import type { Attempt, Mastery } from '../lib/types'
import { PHONEMES } from '../audio/phonemes'
import { buildSeed } from './seed'

const STORAGE_KEY = 'phonicsforge.v1'

interface SaveData {
  attempts: Attempt[]
  xp: number
}

/** XP awarded for one rep — rewards effort, with a bonus for a strong attempt. */
export function xpForScore(score: number): number {
  return Math.round(score / 5) + (score >= 85 ? 10 : 0)
}

/** Level curve. Gentle square-root growth so early levels come quickly. */
export function levelInfo(xp: number): {
  level: number
  intoLevel: number
  span: number
  progress: number
} {
  const level = Math.floor(Math.sqrt(xp) / 4) + 1
  const xpForLevel = (l: number) => Math.pow((l - 1) * 4, 2)
  const start = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const span = next - start
  const intoLevel = xp - start
  return { level, intoLevel, span, progress: span > 0 ? intoLevel / span : 0 }
}

// --- in-memory state + persistence -----------------------------------------

function loadInitial(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SaveData
  } catch {
    // Corrupt/unavailable storage — fall through to a fresh seeded state.
  }
  const attempts = buildSeed()
  const xp = attempts.reduce((sum, a) => sum + xpForScore(a.score), 0)
  const fresh = { attempts, xp }
  persist(fresh)
  return fresh
}

function persist(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage may be full or blocked (private mode). The app still works for
    // the current session; we just can't persist. Failing silently is correct.
  }
}

let state: SaveData = loadInitial()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export const gameStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot(): SaveData {
    return state
  },
  /** Persist one completed rep and award XP. Returns whether the learner levelled up. */
  recordAttempt(phonemeId: string, score: number): boolean {
    const before = levelInfo(state.xp).level
    const attempt: Attempt = { phonemeId, score: Math.round(score), at: Date.now() }
    state = {
      attempts: [...state.attempts, attempt],
      xp: state.xp + xpForScore(score),
    }
    persist(state)
    emit()
    return levelInfo(state.xp).level > before
  },
  /** Wipe progress and re-seed (used by the "Reset" control / demos). */
  reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore — see persist()
    }
    state = loadInitial()
    emit()
  },
}

// --- derived analytics (pure functions over the attempt log) ----------------

/** Average score per phoneme across all history. */
export function masteryByPhoneme(attempts: Attempt[]): Mastery[] {
  return PHONEMES.map((p) => {
    const reps = attempts.filter((a) => a.phonemeId === p.id)
    const avg = reps.length ? reps.reduce((s, a) => s + a.score, 0) / reps.length : 0
    const latest = reps.length ? reps[reps.length - 1].score : 0
    return { phonemeId: p.id, attempts: reps.length, avg: Math.round(avg), latest }
  })
}

/** Daily average score, oldest → newest, for the trend line. */
export function dailySeries(attempts: Attempt[]): { date: string; avg: number }[] {
  const byDay = new Map<string, number[]>()
  for (const a of attempts) {
    const key = new Date(a.at).toISOString().slice(0, 10)
    const bucket = byDay.get(key) ?? []
    bucket.push(a.score)
    byDay.set(key, bucket)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date: date.slice(5), // MM-DD
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }))
}

/**
 * The headline metric: for every phoneme practised since `sessionStart`,
 * compare the learner's last score *before* the session to their best score
 * *during* it. This is the "accuracy before vs after one session" outcome.
 */
export function sessionDelta(
  attempts: Attempt[],
  sessionStart: number,
): { phonemeId: string; before: number; after: number; delta: number }[] {
  const out: { phonemeId: string; before: number; after: number; delta: number }[] = []
  for (const p of PHONEMES) {
    const reps = attempts.filter((a) => a.phonemeId === p.id)
    const during = reps.filter((a) => a.at >= sessionStart)
    if (during.length === 0) continue
    const prior = reps.filter((a) => a.at < sessionStart)
    const before = prior.length ? prior[prior.length - 1].score : during[0].score
    const after = Math.max(...during.map((a) => a.score))
    out.push({ phonemeId: p.id, before, after, delta: after - before })
  }
  return out
}

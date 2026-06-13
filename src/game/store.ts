// store.ts — The offline game state: practice attempts, XP, and the derived
// analytics the dashboard reads. Persisted to localStorage so progress survives
// reloads with zero backend (the brief's "fully offline" requirement).
//
// It is exposed as an external store (subscribe / getSnapshot) so React
// components can bind to it with useSyncExternalStore — no global context, no
// prop-drilling, and a single source of truth.

import type { Attempt, Mastery } from '../lib/types'
import { PHONEMES } from '../audio/phonemes'

// v2: starts EMPTY (the old v1 shipped a fabricated 14-day seed). Every point on
// the dashboard is now a real thing the child said — the chart fills in as they
// practise. Bumping the key also discards any leftover seeded v1 data.
const STORAGE_KEY = 'babble.game.v2'

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
    // Corrupt/unavailable storage — fall through to a fresh empty state.
  }
  // No seed: a new learner starts at zero XP and an empty history. Real reps
  // (Coach + the diagnostic) are the only thing that fills it.
  return { attempts: [], xp: 0 }
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

// --- adaptive time series ---------------------------------------------------
// The dashboard trend zooms its own time axis to match how much history exists:
// a first session is plotted by the HOUR; once practice spans several days it
// rolls up to DAYS, then MONTHS, then YEARS. So the chart is dense and useful on
// day one and stays readable a year later — never a thousand single-rep points.

export type TimeGranularity = 'hour' | 'day' | 'month' | 'year'
export interface SeriesPoint {
  label: string
  avg: number
  reps: number
}
export interface AdaptiveSeries {
  granularity: TimeGranularity
  points: SeriesPoint[]
}

const DAY_MS = 86_400_000

/** Reps recorded since local midnight — drives the home daily goal. */
export function repsToday(attempts: Attempt[], now: number = Date.now()): number {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return attempts.filter((a) => a.at >= start.getTime()).length
}

function pickGranularity(spanMs: number): TimeGranularity {
  if (spanMs <= DAY_MS) return 'hour'
  if (spanMs <= 45 * DAY_MS) return 'day'
  if (spanMs <= 730 * DAY_MS) return 'month'
  return 'year'
}

function bucketKeyLabel(at: number, g: TimeGranularity): { key: string; label: string } {
  const d = new Date(at)
  if (g === 'hour') {
    const h = d.getHours()
    const h12 = ((h + 11) % 12) + 1
    return { key: `${d.toDateString()} ${h}`, label: `${h12}${h < 12 ? 'am' : 'pm'}` }
  }
  if (g === 'day') {
    return { key: d.toISOString().slice(0, 10), label: `${d.getMonth() + 1}/${d.getDate()}` }
  }
  if (g === 'month') {
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString(undefined, { month: 'short' }),
    }
  }
  return { key: `${d.getFullYear()}`, label: `${d.getFullYear()}` }
}

/** Average score per time-bucket, bucket size chosen from the data's span. */
export function adaptiveSeries(attempts: Attempt[]): AdaptiveSeries {
  if (attempts.length === 0) return { granularity: 'hour', points: [] }
  const sorted = [...attempts].sort((a, b) => a.at - b.at)
  const span = sorted[sorted.length - 1].at - sorted[0].at
  const g = pickGranularity(span)
  const buckets = new Map<string, { label: string; scores: number[] }>()
  for (const a of sorted) {
    const { key, label } = bucketKeyLabel(a.at, g)
    const b = buckets.get(key) ?? { label, scores: [] }
    b.scores.push(a.score)
    buckets.set(key, b)
  }
  // Map keeps insertion (chronological) order.
  const points = [...buckets.values()].map((b) => ({
    label: b.label,
    avg: Math.round(b.scores.reduce((s, v) => s + v, 0) / b.scores.length),
    reps: b.scores.length,
  }))
  return { granularity: g, points }
}

const GRANULARITY_LABEL: Record<TimeGranularity, string> = {
  hour: 'by hour today',
  day: 'by day',
  month: 'by month',
  year: 'by year',
}

export function granularityLabel(g: TimeGranularity): string {
  return GRANULARITY_LABEL[g]
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

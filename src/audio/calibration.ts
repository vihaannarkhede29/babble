// calibration.ts — Per-speaker calibration.
//
// The phoneme targets are adult-male reference formants. Children, women, and
// many men have a shorter/longer vocal tract, so their formants are shifted —
// worst for the open vowels, which is exactly what made "cat"/"hot" score badly
// even when pronounced correctly.
//
// The fix: have the speaker say three anchor vowels once (EE / AH / OO — the
// corners of the vowel triangle). We measure THEIR formants for those, then
// solve a 2-D affine map that warps their vowel space onto the reference space.
// Three anchors give exactly enough constraints for a unique affine transform.
// We then apply that map to every measured formant before scoring, so the rest
// of the pipeline is unchanged and the Coach scores the speaker's real voice.
//
// Everything stays on-device (localStorage); no audio, just six numbers.

import { PHONEMES } from './phonemes'

/** The three anchor sounds, in capture order. */
export const ANCHOR_IDS = ['iy', 'aa', 'uw'] as const
export type AnchorId = (typeof ANCHOR_IDS)[number]

/** A point in formant space (Hz). */
export interface Formants {
  f1: number
  f2: number
}

/**
 * The affine map as two rows of 3 coefficients:
 *   f1' = m[0]·f1 + m[1]·f2 + m[2]
 *   f2' = m[3]·f1 + m[4]·f2 + m[5]
 */
export interface Calibration {
  m: number[] // length 6
}

const STORAGE_KEY = 'phonicsforge.calibration.v1'

/** Reference formants for the anchors (the adult-male targets we map onto). */
function referenceAnchors(): Formants[] {
  return ANCHOR_IDS.map((id) => {
    const p = PHONEMES.find((ph) => ph.id === id)!
    return { f1: p.f1, f2: p.f2 }
  })
}

/** Determinant of a 3×3 matrix given as rows. */
function det3(a: number[][]): number {
  return (
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
  )
}

/** Solve A·x = b for a 3×3 system via Cramer's rule. Returns null if singular. */
function solve3(A: number[][], b: number[]): number[] | null {
  const d = det3(A)
  if (Math.abs(d) < 1e-6) return null
  const col = (i: number) => A.map((row, r) => row.map((v, c) => (c === i ? b[r] : v)))
  return [det3(col(0)) / d, det3(col(1)) / d, det3(col(2)) / d]
}

/**
 * Fit the affine map from three measured anchor formants to the references.
 * Returns null if the anchors are degenerate (e.g. the speaker said the same
 * vowel three times), so we can ask them to try again instead of corrupting it.
 */
export function fitCalibration(measured: Formants[]): Calibration | null {
  if (measured.length !== 3) return null
  const ref = referenceAnchors()
  // Same design matrix for both output rows: [f1 f2 1] per anchor.
  const A = measured.map((p) => [p.f1, p.f2, 1])
  const row1 = solve3(A, ref.map((r) => r.f1))
  const row2 = solve3(A, ref.map((r) => r.f2))
  if (!row1 || !row2) return null
  return { m: [...row1, ...row2] }
}

/** Apply a calibration (identity when null) to a measured formant pair. */
export function applyCalibration(cal: Calibration | null, f1: number, f2: number): Formants {
  if (!cal) return { f1, f2 }
  const m = cal.m
  return { f1: m[0] * f1 + m[1] * f2 + m[2], f2: m[3] * f1 + m[4] * f2 + m[5] }
}

// --- persistence (cached so the scorer can read it every frame cheaply) ------

let cached: Calibration | null | undefined // undefined = not yet loaded

function load(): Calibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Calibration
  } catch {
    // ignore
  }
  return null
}

/** Current stored calibration (or null). */
export function getCalibration(): Calibration | null {
  if (cached === undefined) cached = load()
  return cached
}

/** Convenience: calibrate a measured formant pair with the stored map. */
export function calibratedFormants(f1: number, f2: number): Formants {
  return applyCalibration(getCalibration(), f1, f2)
}

export function setCalibration(cal: Calibration): void {
  cached = cal
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cal))
  } catch {
    // ignore — still active for this session
  }
}

export function clearCalibration(): void {
  cached = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function isCalibrated(): boolean {
  return getCalibration() !== null
}

// dsp.ts — On-device digital signal processing.
//
// This is the real acoustic engine. Given a short window of raw microphone
// samples it extracts the features that distinguish one speech sound from
// another, entirely in the browser with no model download and no network:
//
//   • RMS energy        — how loud (used to ignore silence)
//   • Zero-crossing rate — how "noisy" (fricatives vs vowels)
//   • Spectral centroid  — brightness, separates /s/ from /ʃ/   [via FFT]
//   • Formants F1, F2    — resonances of the vocal tract that define vowels
//                          [via Linear Predictive Coding]
//
// The vowel formants are the heart of it. F1 tracks how open the mouth/jaw is;
// F2 tracks how far forward the tongue sits. That is exactly what we need to
// (a) score the sound and (b) draw the correct tongue position.
//
// References for the method and the target values:
//   Peterson & Barney (1952), "Control Methods Used in a Study of the Vowels"
//   Rabiner & Schafer, "Digital Processing of Speech Signals" (LPC, Levinson–Durbin)

import type { AcousticFrame } from '../lib/types'

/** Below this RMS we treat the window as silence and skip formant analysis. */
const VOICING_RMS_THRESHOLD = 0.014
/** Vowel formants live below ~3 kHz, so we analyse a downsampled signal. */
const FORMANT_TARGET_FS = 8000
/** Pre-emphasis flattens the spectral tilt of voiced speech, sharpening formants. */
const PRE_EMPHASIS = 0.97

// ---------------------------------------------------------------------------
// Basic time-domain measures
// ---------------------------------------------------------------------------

/** Root-mean-square amplitude of the window. */
export function rms(x: Float32Array): number {
  let sum = 0
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i]
  return Math.sqrt(sum / x.length)
}

/** Fraction of adjacent samples that change sign. High for hissy/noisy sounds. */
export function zeroCrossingRate(x: Float32Array): number {
  let crossings = 0
  for (let i = 1; i < x.length; i++) {
    if ((x[i] >= 0 && x[i - 1] < 0) || (x[i] < 0 && x[i - 1] >= 0)) crossings++
  }
  return crossings / x.length
}

// ---------------------------------------------------------------------------
// FFT (iterative radix-2 Cooley–Tukey) — used only for the spectral centroid
// ---------------------------------------------------------------------------

/** In-place complex FFT. `re`/`im` length must be a power of two. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  // Butterflies.
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < len / 2; k++) {
        const aRe = re[i + k]
        const aIm = im[i + k]
        const bRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm
        const bIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe
        re[i + k] = aRe + bRe
        im[i + k] = aIm + bIm
        re[i + k + len / 2] = aRe - bRe
        im[i + k + len / 2] = aIm - bIm
        const nextRe = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nextRe
      }
    }
  }
}

/** Smallest power of two >= n. */
function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

/**
 * Spectral centroid in Hz — the magnitude-weighted mean frequency.
 * A bright /s/ sits near 6–8 kHz; a duller /ʃ/ ("sh") near 3–4 kHz.
 */
export function spectralCentroid(x: Float32Array, sampleRate: number): number {
  const n = nextPow2(x.length)
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  // Hann window reduces spectral leakage before the transform.
  for (let i = 0; i < x.length; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (x.length - 1))
    re[i] = x[i] * w
  }
  fft(re, im)
  let weighted = 0
  let total = 0
  for (let k = 1; k < n / 2; k++) {
    const mag = Math.hypot(re[k], im[k])
    const freq = (k * sampleRate) / n
    weighted += freq * mag
    total += mag
  }
  return total > 0 ? weighted / total : 0
}

// ---------------------------------------------------------------------------
// Formant estimation via Linear Predictive Coding
// ---------------------------------------------------------------------------

/** y[n] = x[n] − a·x[n−1]. Boosts higher formants that voicing attenuates. */
function preEmphasis(x: Float32Array, a = PRE_EMPHASIS): Float32Array {
  const y = new Float32Array(x.length)
  y[0] = x[0]
  for (let i = 1; i < x.length; i++) y[i] = x[i] - a * x[i - 1]
  return y
}

/**
 * Crude anti-aliasing decimation: a moving-average low-pass (first spectral
 * null at the new sample rate) followed by picking every `factor`-th sample.
 * Good enough to keep vowel formants intact while shrinking the work.
 */
function decimate(x: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return x
  const outLen = Math.floor(x.length / factor)
  const out = new Float32Array(outLen)
  for (let i = 0; i < outLen; i++) {
    let acc = 0
    const start = i * factor
    for (let j = 0; j < factor; j++) acc += x[start + j]
    out[i] = acc / factor
  }
  return out
}

/** Hamming-windowed autocorrelation r[0..order]. */
function autocorrelation(x: Float32Array, order: number): Float64Array {
  const n = x.length
  const win = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1))
    win[i] = x[i] * w
  }
  const r = new Float64Array(order + 1)
  for (let lag = 0; lag <= order; lag++) {
    let sum = 0
    for (let i = 0; i < n - lag; i++) sum += win[i] * win[i + lag]
    r[lag] = sum
  }
  return r
}

/**
 * Levinson–Durbin recursion. Solves the autocorrelation normal equations for
 * the LPC coefficients of the all-pole vocal-tract model
 *   A(z) = 1 − Σ a_k z^−k.
 * Returns `a` (length order+1, a[0] = 1).
 */
function levinsonDurbin(r: Float64Array, order: number): Float64Array {
  const a = new Float64Array(order + 1)
  a[0] = 1
  let err = r[0]
  if (err <= 0) return a // silence — flat filter

  for (let i = 1; i <= order; i++) {
    // Reflection coefficient k.
    let acc = r[i]
    for (let j = 1; j < i; j++) acc -= a[j] * r[i - j]
    const k = acc / err

    // Update coefficients symmetrically.
    const prev = a.slice(0, i)
    a[i] = k
    for (let j = 1; j < i; j++) a[j] = prev[j] - k * prev[i - j]

    err *= 1 - k * k
    if (err <= 0) break // numerical floor — stop early
  }
  return a
}

/**
 * Find formant frequencies by sampling the LPC spectral envelope 1/|A(e^jw)|
 * and picking its peaks. Returns peaks sorted by frequency.
 */
function lpcPeaks(a: Float64Array, fs: number): number[] {
  const order = a.length - 1
  const steps = 512
  const maxHz = fs / 2
  const env = new Float64Array(steps)
  for (let s = 0; s < steps; s++) {
    const f = (s / steps) * maxHz
    const w = (2 * Math.PI * f) / fs
    // A(e^jw) = 1 − Σ a_k e^{-jwk}
    let re = 1
    let im = 0
    for (let k = 1; k <= order; k++) {
      re -= a[k] * Math.cos(w * k)
      im += a[k] * Math.sin(w * k)
    }
    const mag = Math.hypot(re, im)
    env[s] = mag > 1e-9 ? 1 / mag : 0 // 1/|A| = resonance strength
  }
  const peaks: number[] = []
  for (let s = 1; s < steps - 1; s++) {
    if (env[s] > env[s - 1] && env[s] >= env[s + 1]) {
      peaks.push((s / steps) * maxHz)
    }
  }
  return peaks
}

/** Estimate (F1, F2) in Hz from a window of samples. Returns 0s if not voiced. */
export function estimateFormants(
  x: Float32Array,
  sampleRate: number,
): { f1: number; f2: number } {
  const factor = Math.max(1, Math.round(sampleRate / FORMANT_TARGET_FS))
  const dsFs = sampleRate / factor
  const ds = decimate(preEmphasis(x), factor)
  if (ds.length < 32) return { f1: 0, f2: 0 }

  // LPC order rule of thumb: 2 poles per kHz of bandwidth, plus a couple.
  const order = Math.min(16, Math.max(8, Math.round(dsFs / 1000) + 2))
  const r = autocorrelation(ds, order)
  const a = levinsonDurbin(r, order)
  const peaks = lpcPeaks(a, dsFs)

  // F1 is the lowest peak in a plausible band; F2 the next one above it.
  const f1 = peaks.find((f) => f >= 200 && f <= 1100) ?? 0
  const f2 = peaks.find((f) => f > f1 + 200 && f <= 3200) ?? 0
  return { f1, f2 }
}

/**
 * Voicing confidence in [0,1]: the normalized autocorrelation peak within the
 * human pitch range (≈70–400 Hz). Quasi-periodic voiced speech scores high;
 * broadband background noise is aperiodic and scores low. This is the key
 * defence against treating room noise as if it were a vowel — both for the
 * live score (no wild swings on noise) and for awarding XP (no phantom wins).
 */
export function estimateVoicing(
  x: Float32Array,
  sampleRate: number,
): { periodicity: number; f0: number } {
  // Reuse the same decimated band as the formant path (pitch is well below
  // 4 kHz) to keep the lag search cheap. No pre-emphasis: it would attenuate
  // the fundamental we want to detect.
  const factor = Math.max(1, Math.round(sampleRate / FORMANT_TARGET_FS))
  const ds = decimate(x, factor)
  const dsFs = sampleRate / factor
  const minLag = Math.floor(dsFs / 400)
  const maxLag = Math.floor(dsFs / 70)
  if (ds.length <= maxLag + 1) return { periodicity: 0, f0: 0 }

  // Remove DC so the correlation reflects shape, not offset.
  let mean = 0
  for (let i = 0; i < ds.length; i++) mean += ds[i]
  mean /= ds.length

  let energy = 0
  for (let i = 0; i < ds.length; i++) {
    const d = ds[i] - mean
    energy += d * d
  }
  if (energy <= 0) return { periodicity: 0, f0: 0 }

  // The lag of the strongest peak gives the pitch period → F0.
  let best = 0
  let bestLag = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = lag; i < ds.length; i++) sum += (ds[i] - mean) * (ds[i - lag] - mean)
    const norm = sum / energy
    if (norm > best) {
      best = norm
      bestLag = lag
    }
  }
  const periodicity = best < 0 ? 0 : best > 1 ? 1 : best
  const f0 = bestLag > 0 ? dsFs / bestLag : 0
  return { periodicity, f0 }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/** Run the full feature pipeline on one window of microphone samples. */
export function analyzeFrame(x: Float32Array, sampleRate: number): AcousticFrame {
  const energy = rms(x)
  const voiced = energy >= VOICING_RMS_THRESHOLD
  const zcr = zeroCrossingRate(x)
  // Only spend cycles on spectral/formant/pitch work when there is real energy.
  const centroid = voiced ? spectralCentroid(x, sampleRate) : 0
  const { periodicity, f0 } = voiced
    ? estimateVoicing(x, sampleRate)
    : { periodicity: 0, f0: 0 }
  const { f1, f2 } = voiced ? estimateFormants(x, sampleRate) : { f1: 0, f2: 0 }
  return { rms: energy, voiced, periodicity, f0, zcr, centroid, f1, f2 }
}

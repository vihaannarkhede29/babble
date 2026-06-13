// scorer.ts — Turns one acoustic measurement into a 0..1 match against the
// active target sound, plus a child-friendly correction ("hint").
//
// Two scoring strategies, chosen per phoneme:
//   • vowels    → distance in the F1/F2 vowel space (Gaussian-shaped reward)
//   • sibilants → distance of the spectral centroid in octaves
//
// The reward curves are deliberately gentle. This is a tool for 4–6 year-olds:
// "close" should feel like success, and the dragon should celebrate often.

import type { AcousticFrame, Phoneme, ScoreResult, VowelPoint } from '../lib/types'
import { formantToVowel, targetVowel } from './phonemes'

/** Spread of the vowel-space reward (in normalized units). Larger = more lenient. */
const VOWEL_SIGMA = 0.3
/** Spread of the sibilant reward (in octaves). */
const SIBILANT_SIGMA_OCT = 0.6

const CENTER: VowelPoint = { front: 0.5, open: 0.5 }

/** Compare one frame against a target phoneme. */
export function scoreFrame(frame: AcousticFrame, target: Phoneme): ScoreResult {
  return target.mode === 'sibilant'
    ? scoreSibilant(frame, target)
    : scoreVowel(frame, target)
}

// ---------------------------------------------------------------------------
// Vowels
// ---------------------------------------------------------------------------

function scoreVowel(frame: AcousticFrame, target: Phoneme): ScoreResult {
  // No voiced formants → nothing to score yet.
  if (!frame.voiced || frame.f1 <= 0 || frame.f2 <= 0) {
    return { accuracy: 0, live: CENTER, hint: 'Take a breath and make the sound!' }
  }

  const live = formantToVowel(frame.f1, frame.f2)
  const goal = targetVowel(target)
  const dist = Math.hypot(live.front - goal.front, live.open - goal.open)
  const accuracy = gaussian(dist, VOWEL_SIGMA)

  return { accuracy, live, hint: vowelHint(live, goal, target, accuracy) }
}

/** Pick the single most useful correction based on the dominant axis error. */
function vowelHint(
  live: VowelPoint,
  goal: VowelPoint,
  target: Phoneme,
  accuracy: number,
): string {
  if (accuracy > 0.85) return '' // on target — praise is handled by the dragon

  const openErr = goal.open - live.open // + means "be more open"
  const frontErr = goal.front - live.front // + means "be more front"

  // Rounded back vowels (OO/OH): lip shape is the most actionable cue.
  if (target.lipRounding > 0.6 && frontErr < -0.1) {
    return 'Round your lips like a kiss! 💋'
  }

  if (Math.abs(openErr) >= Math.abs(frontErr)) {
    return openErr > 0 ? 'Open your mouth wider! 😮' : 'Relax — close a little 🙂'
  }
  return frontErr > 0 ? 'Smile! Push your tongue forward 😁' : 'Pull your tongue back 😯'
}

// ---------------------------------------------------------------------------
// Sibilants (/s/, /ʃ/)
// ---------------------------------------------------------------------------

function scoreSibilant(frame: AcousticFrame, target: Phoneme): ScoreResult {
  const goal = target.centroidTarget ?? 5000
  // A sibilant needs airflow (energy) and turbulence (high zero-crossing rate).
  if (!frame.voiced || frame.zcr < 0.08 || frame.centroid <= 0) {
    return {
      accuracy: 0,
      live: { front: 0.5, open: 0.1 },
      hint: 'Make a long hissing sound!',
    }
  }

  // Distance measured in octaves so it matches how we hear pitch/brightness.
  const octaves = Math.abs(Math.log2(frame.centroid / goal))
  const accuracy = gaussian(octaves, SIBILANT_SIGMA_OCT)
  const live = { front: clamp01(frame.centroid / 8000), open: 0.1 }

  let hint = ''
  if (accuracy <= 0.85) {
    hint =
      frame.centroid < goal
        ? 'Brighter! Tongue up near your teeth — sss 🐍'
        : 'Softer and lower — shhh 🤫'
  }
  return { accuracy, live, hint }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gaussian reward: 1 at distance 0, falling off smoothly with `sigma`. */
function gaussian(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma))
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

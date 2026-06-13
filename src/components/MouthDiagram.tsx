// MouthDiagram.tsx — The signature visual: a procedurally drawn mid-sagittal
// (side-view) cross-section of the mouth that shows the child exactly where to
// put their tongue and lips.
//
// Nothing here is a pre-baked image. The tongue path, jaw opening and lip shape
// are all computed from articulation parameters, so the SAME component renders:
//   • the GOAL pose (dashed outline) from the target phoneme, and
//   • the LIVE pose (solid, colour-coded) from the child's measured formants.
// When the two overlap, the sound is right — and it glows green.

import type { Phoneme, VowelPoint } from '../lib/types'
import { scoreColor } from '../lib/colors'

interface Articulation {
  tongueHeight: number // 1 high/close … 0 low/open
  tongueFront: number // 1 front … 0 back
  lipRounding: number // 1 rounded … 0 spread
  jawOpen: number // 1 open … 0 closed
}

interface Props {
  target: Phoneme
  /** Live vowel-space point from the scorer, or null when idle. */
  live: VowelPoint | null
  /** 0..1, drives the colour and glow of the live tongue. */
  accuracy: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Recover articulation from a measured vowel-space point. */
function liveArticulation(p: VowelPoint): Articulation {
  return {
    tongueHeight: 1 - p.open,
    tongueFront: p.front,
    jawOpen: p.open,
    lipRounding: Math.max(0, (1 - p.front) * 0.7), // back vowels look rounder
  }
}

/** Build the tongue outline path from a hump position. */
function tonguePath({ tongueHeight, tongueFront }: Articulation): string {
  const apexX = lerp(112, 205, tongueFront)
  const apexY = lerp(150, 92, tongueHeight)
  const tipY = lerp(150, 112, tongueHeight)
  return [
    `M 88 184`,
    `C 96 168, ${apexX - 50} ${apexY}, ${apexX} ${apexY}`,
    `C ${apexX + 46} ${apexY}, 214 ${tipY}, 232 ${tipY}`,
    `L 232 190 L 88 190 Z`,
  ].join(' ')
}

const MOUTH_CENTER = 150

/** Lip ellipses (upper/lower) from jaw opening + rounding. */
function lips({ jawOpen, lipRounding }: Articulation) {
  const gap = lerp(12, 74, jawOpen)
  const protrude = lerp(0, 14, lipRounding)
  const rx = lerp(9, 7, lipRounding)
  const ry = lerp(8, 13, lipRounding) // rounded lips are taller/pursed
  return {
    upper: { cx: 240 + protrude, cy: MOUTH_CENTER - gap / 2 - ry, rx, ry },
    lower: { cx: 240 + protrude, cy: MOUTH_CENTER + gap / 2 + ry, rx, ry },
  }
}

export function MouthDiagram({ target, live, accuracy }: Props) {
  const goal: Articulation = {
    tongueHeight: target.tongueHeight,
    tongueFront: target.tongueFront,
    lipRounding: target.lipRounding,
    jawOpen: target.jawOpen,
  }
  // While the child is making a sound we show their live pose; otherwise we
  // park the live tongue on the goal so the diagram reads as "do this".
  const current = live ? liveArticulation(live) : goal
  const color = live ? scoreColor(accuracy) : '#a78bfa'
  const goalLips = lips(goal)
  const liveLips = lips(current)

  return (
    <svg viewBox="0 0 300 240" className="mouth-diagram" role="img"
      aria-label={`How to say ${target.label}: tongue and lip position`}>
      {/* Face / cheek mass */}
      <path
        d="M 40 40 Q 250 20 270 90 L 270 150 Q 270 215 150 220 Q 50 220 40 150 Z"
        className="mouth-face"
      />
      {/* Nasal cavity + hard palate (fixed anatomy) */}
      <path d="M 250 78 Q 150 60 92 74" className="mouth-palate" />
      <path d="M 92 74 Q 80 120 88 184" className="mouth-pharynx" />

      {/* Upper teeth, just behind the upper lip */}
      <rect x="222" y={goalLips.upper.cy - 2} width="14" height="16" rx="2" className="mouth-teeth" />

      {/* GOAL pose — dashed, faint: where the tongue should be */}
      <path d={tonguePath(goal)} className="tongue-goal" />
      <ellipse {...goalLips.upper} className="lip-goal" />
      <ellipse {...goalLips.lower} className="lip-goal" />

      {/* LIVE pose — solid, colour-coded by accuracy */}
      <path
        d={tonguePath(current)}
        fill={color}
        className="tongue-live"
        style={{ filter: live && accuracy > 0.8 ? 'drop-shadow(0 0 8px currentColor)' : 'none', color }}
      />
      <ellipse {...liveLips.upper} fill={color} className="lip-live" />
      <ellipse {...liveLips.lower} fill={color} className="lip-live" />

      {/* The sound being practised */}
      <text x="150" y="28" className="mouth-label">
        {target.label}
      </text>
    </svg>
  )
}

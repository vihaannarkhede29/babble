// VowelSpace.tsx — A live plot of the acoustic vowel space (the F1/F2 chart
// linguists use). Each vowel target sits at a fixed spot; the child's voice
// shows up as a moving dot that the scorer derives from the measured formants.
//
// This is the "proof it's real" visual: say "EE" and the dot leaps to one
// corner; say "AH" and it jumps to another. Nothing scripted — it's the live
// formant estimate from dsp.ts.

import type { Phoneme, VowelPoint } from '../lib/types'
import { PHONEMES, targetVowel } from '../audio/phonemes'
import { scoreColor } from '../lib/colors'

interface Props {
  target: Phoneme
  live: VowelPoint | null
  accuracy: number
}

const W = 220
const H = 220
const PAD = 26

// front: 0 (back) → 1 (front) maps left → right.
// open:  0 (close/high) → 1 (open/low) maps top → bottom.
const toX = (front: number) => PAD + front * (W - 2 * PAD)
const toY = (open: number) => PAD + open * (H - 2 * PAD)

const VOWELS = PHONEMES.filter((p) => p.mode === 'formant')

export function VowelSpace({ target, live, accuracy }: Props) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="vowel-space" role="img"
      aria-label="Live vowel chart showing your tongue position">
      {/* frame + grid */}
      <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} className="vs-frame" />
      <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} className="vs-grid" />
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="vs-grid" />

      {/* axis labels */}
      <text x={PAD - 6} y={H / 2} className="vs-axis" textAnchor="end">back</text>
      <text x={W - PAD + 6} y={H / 2} className="vs-axis" textAnchor="start">front</text>
      <text x={W / 2} y={PAD - 10} className="vs-axis" textAnchor="middle">close</text>
      <text x={W / 2} y={H - PAD + 16} className="vs-axis" textAnchor="middle">open</text>

      {/* every vowel target */}
      {VOWELS.map((p) => {
        const v = targetVowel(p)
        const active = p.id === target.id
        return (
          <g key={p.id}>
            <circle cx={toX(v.front)} cy={toY(v.open)} r={active ? 11 : 7}
              className={active ? 'vs-target vs-target--active' : 'vs-target'} />
            <text x={toX(v.front)} y={toY(v.open) + 4} className="vs-target-label"
              textAnchor="middle">{p.label}</text>
          </g>
        )
      })}

      {/* the live voice marker */}
      {live && (
        <circle cx={toX(live.front)} cy={toY(live.open)} r={9}
          fill={scoreColor(accuracy)} className="vs-live" />
      )}
    </svg>
  )
}

// ScoreMeter.tsx — A big, friendly radial gauge of the live accuracy. Pure SVG,
// colour-coded with the shared score ramp so it matches the mouth and marker.

import { scoreColor } from '../lib/colors'

interface Props {
  /** 0..1 live accuracy. */
  level: number
  /** 0..1 best-so-far this hold, shown as a tick. */
  best?: number
}

const R = 52
const CIRC = 2 * Math.PI * R

export function ScoreMeter({ level, best = 0 }: Props) {
  const pct = Math.round(level * 100)
  const dash = CIRC * level
  return (
    <div className="score-meter">
      <svg viewBox="0 0 140 140" aria-label={`Accuracy ${pct} percent`}>
        <circle cx="70" cy="70" r={R} className="meter-track" />
        <circle
          cx="70"
          cy="70"
          r={R}
          className="meter-fill"
          stroke={scoreColor(level)}
          strokeDasharray={`${dash} ${CIRC}`}
          transform="rotate(-90 70 70)"
        />
        {best > 0 && (
          // best-so-far tick
          <circle cx="70" cy="70" r={R} className="meter-best"
            strokeDasharray={`2 ${CIRC}`}
            strokeDashoffset={-CIRC * best + 1}
            transform="rotate(-90 70 70)" />
        )}
        <text x="70" y="74" className="meter-text" fill={scoreColor(level)}>
          {pct}
        </text>
        <text x="70" y="94" className="meter-unit">% match</text>
      </svg>
    </div>
  )
}

// PhonemeMatrix.tsx — The target word split into per-sound cards: [ S ][ UH ][ N ].
//
// After an attempt, each card reflects what happened: a correct word bounces all
// cards green; a near-miss wobbles the focus sound amber-red while the rest stay
// green; a total miss leaves them neutral. Driven entirely by the word-match
// result (no per-phoneme audio grading — we infer it from which sound slipped).

import { articulationFor } from '../speech/articulation'

export type PhonemeStatus = 'idle' | 'success' | 'error'

interface Props {
  phonemes: string[]
  statuses: PhonemeStatus[]
}

export function PhonemeMatrix({ phonemes, statuses }: Props) {
  return (
    <div className="phoneme-matrix" aria-hidden="true">
      {phonemes.map((p, i) => (
        <span key={i} className={`phoneme-cell phoneme-cell--${statuses[i] ?? 'idle'}`}>
          {articulationFor(p).label}
        </span>
      ))}
    </div>
  )
}

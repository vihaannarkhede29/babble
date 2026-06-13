// PhonemeMatrix.tsx — The target word split into per-sound cards: [ S ][ UH ][ N ].
//
// After an attempt, each card reflects what happened: a correct word bounces all
// cards green; a near-miss wobbles the focus sound amber-red while the rest stay
// green; a total miss leaves them neutral. Driven entirely by the word-match
// result (no per-phoneme audio grading — we infer it from which sound slipped).

export type PhonemeStatus = 'idle' | 'success' | 'error'

/** IPA → kid-readable token for the card face. */
const FACE: Record<string, string> = {
  s: 'S', ʃ: 'SH', ʌ: 'UH', ɪ: 'IH', iː: 'EE', p: 'P', n: 'N', m: 'M',
  r: 'R', ɛ: 'EH', d: 'D', uː: 'OO',
}

interface Props {
  phonemes: string[]
  statuses: PhonemeStatus[]
}

export function PhonemeMatrix({ phonemes, statuses }: Props) {
  return (
    <div className="phoneme-matrix" aria-hidden="true">
      {phonemes.map((p, i) => (
        <span key={i} className={`phoneme-cell phoneme-cell--${statuses[i] ?? 'idle'}`}>
          {FACE[p] ?? p.toUpperCase()}
        </span>
      ))}
    </div>
  )
}

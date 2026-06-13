// SoundPicker.tsx — The strip of sounds to practise. Tapping a card makes it
// the active target. A small coloured dot shows current mastery per sound.

import type { Mastery, Phoneme } from '../lib/types'
import { scoreColorPct } from '../lib/colors'

interface Props {
  phonemes: Phoneme[]
  activeId: string
  mastery: Mastery[]
  onSelect: (p: Phoneme) => void
}

export function SoundPicker({ phonemes, activeId, mastery, onSelect }: Props) {
  return (
    <div className="sound-picker" role="tablist" aria-label="Choose a sound">
      {phonemes.map((p) => {
        const m = mastery.find((x) => x.phonemeId === p.id)
        const active = p.id === activeId
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={active}
            className={`sound-card${active ? ' sound-card--active' : ''}`}
            onClick={() => onSelect(p)}
          >
            <span className="sound-emoji">{p.emoji}</span>
            <span className="sound-label">{p.label}</span>
            <span className="sound-word">{p.exampleWord}</span>
            {m && m.attempts > 0 && (
              <span className="sound-mastery" style={{ background: scoreColorPct(m.avg) }}
                title={`${m.avg}% mastery`} />
            )}
          </button>
        )
      })}
    </div>
  )
}

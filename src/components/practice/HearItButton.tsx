import { speakPhonemes, speakWord, type Word } from '../../lib/words'

interface HearItButtonProps {
  word: Word
}

export function HearItButton({ word }: HearItButtonProps) {
  return (
    <button
      type="button"
      className="btn-pressable flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-base font-bold text-cloud shadow-md"
      onClick={() => {
        speakPhonemes(word.phonemes)
        window.setTimeout(() => speakWord(word.label), word.phonemes.length * 400 + 200)
      }}
    >
      <span>Hear It</span>
      <span aria-hidden="true">🔊</span>
    </button>
  )
}

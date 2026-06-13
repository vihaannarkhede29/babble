import { motion } from 'framer-motion'
import type { Word } from '../../lib/words'
import { speakWord } from '../../lib/words'
import { WordIllustration } from './WordIllustration'

interface WordCardProps {
  word: Word
  onSelect: (wordId: string) => void
  rotation?: number
}

export function WordCard({ word, onSelect, rotation = 0 }: WordCardProps) {
  return (
    <div
      className="card-tactile flex w-full flex-col items-center gap-2 p-4 text-left"
      style={{ rotate: `${rotation}deg` }}
    >
      <motion.button
        type="button"
        className="flex w-full flex-col items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelect(word.id)}
      >
        <span className="text-2xl font-black tracking-wider text-forest">{word.label}</span>
        <WordIllustration image={word.image} className="h-20 w-24" />
      </motion.button>
      <button
        type="button"
        className="btn-pressable mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-sunshine text-lg shadow-md"
        aria-label={`Play sound for ${word.label}`}
        onClick={() => speakWord(word.label)}
      >
        🔊
      </button>
    </div>
  )
}

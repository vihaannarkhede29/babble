import { motion } from 'framer-motion'

export type PhonemeResult = 'pending' | 'correct' | 'incorrect'

interface PhonemeBlocksProps {
  phonemes: string[]
  colors: string[]
  results: PhonemeResult[]
  activeIndex?: number
}

const rotations = [-2, 1.5, -1, 2, -1.5, 1]

export function PhonemeBlocks({
  phonemes,
  colors,
  results,
  activeIndex,
}: PhonemeBlocksProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {phonemes.map((phoneme, index) => {
        const result = results[index] ?? 'pending'
        const isActive = activeIndex === index

        return (
          <motion.div
            key={`${phoneme}-${index}`}
            className="relative"
            style={{ rotate: `${rotations[index % rotations.length]}deg` }}
            animate={
              result === 'correct'
                ? { y: [0, -16, 0], scale: [1, 1.05, 1] }
                : result === 'incorrect'
                  ? { x: [0, -8, 8, -6, 6, 0], rotate: [rotations[index % rotations.length], -4, 4, 0] }
                  : { y: 0, x: 0 }
            }
            transition={
              result === 'incorrect'
                ? { duration: 0.5 }
                : { type: 'spring', stiffness: 400, damping: 12 }
            }
          >
            <div
              className={[
                'tile-wood flex h-20 w-16 items-center justify-center rounded-xl border-2 sm:h-24 sm:w-20',
                result === 'correct' && 'border-dragon-teal ring-4 ring-dragon-teal/40',
                result === 'incorrect' && 'border-coral bg-coral/10',
                isActive && result === 'pending' && 'ring-4 ring-sunshine/60',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ borderColor: result === 'pending' ? colors[index] : undefined }}
            >
              <span
                className="font-mono text-4xl font-black sm:text-5xl"
                style={{ color: colors[index] }}
              >
                {phoneme}
              </span>
            </div>
            {index < phonemes.length - 1 && (
              <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl font-bold text-forest/30 sm:block">
                •
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

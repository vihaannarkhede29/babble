import type { WordProgress } from '../../lib/mockProgress'
import { WORDS } from '../../lib/words'
import { WordIllustration } from '../words/WordIllustration'

interface WordProgressGridProps {
  wordProgress: WordProgress[]
}

const statusStyles = {
  mastered: 'border-dragon-teal bg-dragon-teal/10',
  'in-progress': 'border-sunshine bg-sunshine/20',
  'not-started': 'border-forest/20 bg-white',
}

const statusLabels = {
  mastered: 'Mastered',
  'in-progress': 'In Progress',
  'not-started': 'Not Started',
}

export function WordProgressGrid({ wordProgress }: WordProgressGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {WORDS.map((word) => {
        const progress = wordProgress.find((entry) => entry.wordId === word.id)
        const status = progress?.status ?? 'not-started'

        return (
          <div
            key={word.id}
            className={`card-tactile flex flex-col items-center gap-2 border-2 p-4 ${statusStyles[status]}`}
          >
            <span className="text-lg font-black text-forest">{word.label}</span>
            <WordIllustration image={word.image} className="h-16 w-20" />
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-forest">
              {statusLabels[status]}
            </span>
            {progress && progress.attempts > 0 && (
              <span className="text-xs text-forest/70">
                {progress.attempts} attempts · {progress.accuracy}% accuracy
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { DragonCompanion } from '../components/dragon/DragonCompanion'
import { PhonemeBlocks } from '../components/phonemes/PhonemeBlocks'
import { HearItButton } from '../components/practice/HearItButton'
import { MicButton } from '../components/practice/MicButton'
import { MouthDiagram } from '../components/practice/MouthDiagram'
import { useLocalProgress } from '../hooks/useLocalProgress'
import { usePracticeDemo } from '../hooks/usePracticeDemo'
import { getWordById } from '../lib/words'

export function PracticePage() {
  const { word: wordId } = useParams<{ word: string }>()
  const word = getWordById(wordId ?? '')
  const { markWordInProgress } = useLocalProgress()

  if (!word) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4">
        <p className="text-lg font-bold text-forest">Word not found</p>
        <Link to="/" className="mt-4 font-semibold text-dragon-teal underline">
          Go home
        </Link>
      </div>
    )
  }

  return <PracticeContent word={word} onInProgress={markWordInProgress} />
}

function PracticeContent({
  word,
  onInProgress,
}: {
  word: NonNullable<ReturnType<typeof getWordById>>
  onInProgress: (wordId: string) => void
}) {
  const {
    results,
    activeIndex,
    dragonState,
    currentPhoneme,
    isRecording,
    micDisabled,
    handlePressStart,
    handlePressEnd,
  } = usePracticeDemo({ word, onInProgress })

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="btn-pressable rounded-full bg-white px-4 py-2 text-sm font-bold text-forest shadow-md"
        >
          ← Back
        </Link>
        <DragonCompanion state={dragonState} size="sm" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <PhonemeBlocks
          phonemes={word.phonemes}
          colors={word.colors}
          results={results}
          activeIndex={activeIndex}
        />

        <div className="rounded-2xl bg-white px-6 py-4 shadow-md">
          <MouthDiagram phoneme={currentPhoneme} />
        </div>

        <MicButton
          isRecording={isRecording}
          disabled={micDisabled}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
        />

        <HearItButton word={word} />
      </div>
    </div>
  )
}

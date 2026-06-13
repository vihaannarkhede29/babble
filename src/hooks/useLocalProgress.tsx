/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultAccuracyHistory,
  defaultWordProgress,
  type AccuracyDataPoint,
  type WordProgress,
  type WordStatus,
} from '../lib/mockProgress'
import { WORDS } from '../lib/words'

interface StoredProgress {
  taughtToday: string[]
  wordProgress: WordProgress[]
  accuracyHistory: AccuracyDataPoint[]
}

function createInitialProgress(): StoredProgress {
  return {
    taughtToday: [],
    wordProgress: defaultWordProgress,
    accuracyHistory: defaultAccuracyHistory,
  }
}

interface LocalProgressContextValue {
  taughtCount: number
  taughtToday: string[]
  wordProgress: WordProgress[]
  accuracyHistory: AccuracyDataPoint[]
  allWords: typeof WORDS
  markWordMastered: (wordId: string, attempts: number) => void
  markWordInProgress: (wordId: string) => void
  getWordStatus: (wordId: string) => WordStatus
}

const LocalProgressContext = createContext<LocalProgressContextValue | null>(null)

export function LocalProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<StoredProgress>(createInitialProgress)

  const markWordMastered = useCallback((wordId: string, attempts: number) => {
    setProgress((prev) => {
      const taughtToday = prev.taughtToday.includes(wordId)
        ? prev.taughtToday
        : [...prev.taughtToday, wordId]

      const wordProgress = prev.wordProgress.map((entry) =>
        entry.wordId === wordId
          ? {
              ...entry,
              status: 'mastered' as WordStatus,
              attempts,
              accuracy: Math.min(100, 70 + attempts * 5),
            }
          : entry,
      )

      const hasEntry = wordProgress.some((entry) => entry.wordId === wordId)
      const mergedWordProgress = hasEntry
        ? wordProgress
        : [
            ...wordProgress,
            {
              wordId,
              status: 'mastered' as WordStatus,
              attempts,
              accuracy: Math.min(100, 70 + attempts * 5),
            },
          ]

      const lastPoint = prev.accuracyHistory[prev.accuracyHistory.length - 1]
      const accuracyHistory = [...prev.accuracyHistory.slice(0, -1)]
      if (lastPoint) {
        accuracyHistory.push({
          ...lastPoint,
          accuracy: Math.min(100, lastPoint.accuracy + 3),
        })
      }

      return {
        taughtToday,
        wordProgress: mergedWordProgress,
        accuracyHistory,
      }
    })
  }, [])

  const markWordInProgress = useCallback((wordId: string) => {
    setProgress((prev) => {
      const wordProgress = prev.wordProgress.map((entry) =>
        entry.wordId === wordId && entry.status === 'not-started'
          ? { ...entry, status: 'in-progress' as WordStatus }
          : entry,
      )
      return { ...prev, wordProgress }
    })
  }, [])

  const getWordStatus = useCallback(
    (wordId: string): WordStatus => {
      return (
        progress.wordProgress.find((entry) => entry.wordId === wordId)?.status ??
        'not-started'
      )
    },
    [progress.wordProgress],
  )

  const value = useMemo(
    () => ({
      taughtCount: progress.taughtToday.length,
      taughtToday: progress.taughtToday,
      wordProgress: progress.wordProgress,
      accuracyHistory: progress.accuracyHistory,
      allWords: WORDS,
      markWordMastered,
      markWordInProgress,
      getWordStatus,
    }),
    [progress, markWordMastered, markWordInProgress, getWordStatus],
  )

  return (
    <LocalProgressContext.Provider value={value}>{children}</LocalProgressContext.Provider>
  )
}

export function useLocalProgress() {
  const context = useContext(LocalProgressContext)
  if (!context) {
    throw new Error('useLocalProgress must be used within LocalProgressProvider')
  }
  return context
}

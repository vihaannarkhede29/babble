import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DragonState } from '../components/dragon/DragonCompanion'
import type { PhonemeResult } from '../components/phonemes/PhonemeBlocks'
import { starsFromAttempts, xpFromStars } from '../lib/mockProgress'
import { PRACTICE_DEMO_SCRIPTS } from '../lib/practiceScripts'
import { playCorrectDing, prepareAudio } from '../lib/sounds'
import type { Word } from '../lib/words'

type PracticePhase = 'ready' | 'listening' | 'evaluating' | 'feedback'

interface UsePracticeDemoOptions {
  word: Word
  onInProgress?: (wordId: string) => void
  onSuccess?: (result: { attempts: number; stars: number; xp: number }) => void
}

const demoScripts = PRACTICE_DEMO_SCRIPTS

export function usePracticeDemo({ word, onInProgress, onSuccess }: UsePracticeDemoOptions) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<PracticePhase>('ready')
  const [results, setResults] = useState<PhonemeResult[]>(
    word.phonemes.map(() => 'pending'),
  )
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [attempts, setAttempts] = useState(1)
  const [dragonState, setDragonState] = useState<DragonState>('idle')
  const listenTimer = useRef<number | null>(null)
  const evalAbort = useRef(false)

  const resetBlocks = useCallback(() => {
    setResults(word.phonemes.map(() => 'pending'))
    setActiveIndex(undefined)
  }, [word.phonemes])

  const runEvaluation = useCallback(async () => {
    evalAbort.current = false
    setPhase('evaluating')
    setDragonState('listening')

    const script = demoScripts[word.id] ?? word.phonemes.map(() => true)
    const attemptCorrect = attempts === 1 ? script : word.phonemes.map(() => true)

    resetBlocks()

    for (let index = 0; index < word.phonemes.length; index++) {
      if (evalAbort.current) return

      setActiveIndex(index)
      setDragonState('demonstrating')
      await new Promise((resolve) => window.setTimeout(resolve, 400))

      const isCorrect = attemptCorrect[index] ?? true
      setResults((prev) => {
        const next = [...prev]
        next[index] = isCorrect ? 'correct' : 'incorrect'
        return next
      })

      if (isCorrect) {
        void playCorrectDing()
      }

      if (!isCorrect) {
        setDragonState('confused')
        setPhase('feedback')
        setAttempts((value) => value + 1)
        onInProgress?.(word.id)

        await new Promise((resolve) => window.setTimeout(resolve, 1800))
        if (evalAbort.current) return

        resetBlocks()
        setDragonState('idle')
        setPhase('ready')
        return
      }
    }

    setDragonState('celebrating')
    setPhase('feedback')
    onInProgress?.(word.id)

    await new Promise((resolve) => window.setTimeout(resolve, 800))
    if (evalAbort.current) return

    const stars = starsFromAttempts(attempts)
    const xp = xpFromStars(stars)

    if (onSuccess) {
      onSuccess({ attempts, stars, xp })
      return
    }

    navigate(
      `/celebration?word=${word.label}&stars=${stars}&xp=${xp}&attempts=${attempts}&wordId=${word.id}`,
    )
  }, [attempts, navigate, onInProgress, onSuccess, resetBlocks, word])

  const handlePressStart = useCallback(() => {
    if (phase === 'evaluating' || phase === 'feedback') return

    onInProgress?.(word.id)
    void prepareAudio()
    setPhase('listening')
    setDragonState('listening')

    listenTimer.current = window.setTimeout(() => {
      listenTimer.current = null
    }, 1500)
  }, [onInProgress, phase, word.id])

  const handlePressEnd = useCallback(() => {
    if (phase !== 'listening') return

    if (listenTimer.current) {
      window.clearTimeout(listenTimer.current)
      listenTimer.current = null
    }

    void runEvaluation()
  }, [phase, runEvaluation])

  const currentPhoneme =
    activeIndex !== undefined ? word.phonemes[activeIndex] : word.phonemes[0]

  return {
    phase,
    results,
    activeIndex,
    attempts,
    dragonState,
    currentPhoneme,
    isRecording: phase === 'listening',
    micDisabled: phase === 'evaluating' || phase === 'feedback',
    handlePressStart,
    handlePressEnd,
  }
}

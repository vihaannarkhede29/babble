import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfettiOverlay } from '../components/celebration/ConfettiOverlay'
import { StarRating } from '../components/celebration/StarRating'
import { DragonCompanion } from '../components/dragon/DragonCompanion'
import { useLocalProgress } from '../hooks/useLocalProgress'
import { xpFromStars } from '../lib/mockProgress'

export function CelebrationPage() {
  const [params] = useSearchParams()
  const { markWordMastered } = useLocalProgress()

  const word = params.get('word') ?? 'WORD'
  const stars = Number(params.get('stars') ?? 3)
  const attempts = Number(params.get('attempts') ?? 1)
  const wordId = params.get('wordId') ?? word.toLowerCase()
  const xp = Number(params.get('xp') ?? xpFromStars(stars))

  const [displayXp, setDisplayXp] = useState(0)
  const hasRecorded = useRef(false)

  useEffect(() => {
    if (hasRecorded.current) return
    hasRecorded.current = true
    markWordMastered(wordId, attempts)
  }, [attempts, markWordMastered, wordId])

  useEffect(() => {
    let frame = 0
    const totalFrames = 30
    const interval = window.setInterval(() => {
      frame += 1
      setDisplayXp(Math.round((xp * frame) / totalFrames))
      if (frame >= totalFrames) window.clearInterval(interval)
    }, 30)
    return () => window.clearInterval(interval)
  }, [xp])

  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <ConfettiOverlay />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="flex flex-col items-center gap-6"
      >
        <DragonCompanion state="celebrating" size="lg" />

        <div>
          <h1 className="text-3xl font-black text-forest">You did it!</h1>
          <p className="mt-2 text-lg font-bold text-forest/80">
            You taught the dragon <span className="text-dragon-teal">{word}</span>
          </p>
        </div>

        <StarRating stars={stars} />

        <motion.div
          className="rounded-2xl bg-sunshine px-8 py-4 shadow-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <p className="text-sm font-bold uppercase tracking-wide text-forest/70">XP Gained</p>
          <p className="text-4xl font-black text-forest">+{displayXp}</p>
        </motion.div>

        <Link
          to="/"
          className="btn-pressable rounded-full bg-forest px-8 py-4 text-lg font-black text-cloud shadow-lg"
        >
          Teach the dragon another word?
        </Link>
      </motion.div>
    </div>
  )
}

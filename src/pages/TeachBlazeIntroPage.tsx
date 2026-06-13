import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DragonCompanion } from '../components/dragon/DragonCompanion'
import { useChildProfile } from '../hooks/useChildProfile'

export function TeachBlazeIntroPage() {
  const navigate = useNavigate()
  const { profile, completeDiagnostic } = useChildProfile()
  const dragonName = profile.dragonName.trim() || 'Blaze'

  const handleContinue = () => {
    completeDiagnostic()
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-white px-4 py-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <DragonCompanion state="waving" size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 max-w-xs"
        >
          <div className="rounded-2xl border-2 border-forest/10 bg-cloud px-5 py-4 text-left shadow-sm">
            <p className="text-lg font-black text-forest">{dragonName} just hatched!</p>
            <p className="mt-2 text-base font-semibold leading-relaxed text-forest/70">
              He doesn&apos;t know any words yet. Can you teach him some?
            </p>
            <p className="mt-2 text-sm font-bold text-dragon-teal">— {dragonName}</p>
          </div>
        </motion.div>
      </div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="btn-pressable mb-4 w-full rounded-xl bg-dragon-teal py-4 text-lg font-black text-white shadow-lg"
        onClick={handleContinue}
      >
        Let&apos;s teach {dragonName}!
      </motion.button>
    </div>
  )
}

import { motion } from 'framer-motion'
import { DragonCompanion } from '../dragon/DragonCompanion'

interface DragonWelcomeIntroProps {
  dragonName: string
}

export function DragonWelcomeIntro({ dragonName }: DragonWelcomeIntroProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative mb-6 w-full max-w-xs"
      >
        <div className="rounded-2xl border-2 border-forest/10 bg-white px-6 py-5 text-center shadow-[0_2px_12px_rgba(27,58,45,0.08)]">
          <p className="text-xl font-bold leading-snug text-forest/75">
            Hi there! I&apos;m {dragonName}!
          </p>
        </div>
        <div className="flex justify-center">
          <div className="h-3 w-3 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-forest/10 bg-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 18 }}
      >
        <DragonCompanion state="waving" size="xl" />
      </motion.div>
    </div>
  )
}

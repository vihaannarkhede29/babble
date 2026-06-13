import { motion } from 'framer-motion'
import { DragonCompanion } from '../dragon/DragonCompanion'
import { ProgressPreviewChart } from './ProgressPreviewChart'

interface AchievementItem {
  icon: string
  title: string
  description: string
}

const achievements: AchievementItem[] = [
  {
    icon: '🗣️',
    title: 'Speak with confidence',
    description: "I'll help you practice words without pressure — we learn together",
  },
  {
    icon: '🧩',
    title: 'Master sounds step by step',
    description: 'We tackle one sound at a time with colorful blocks and gentle feedback',
  },
  {
    icon: '⏰',
    title: 'Build a learning habit',
    description: "Short daily sessions that fit your family's schedule — I'll be here every night",
  },
]

interface DragonAchievementsIntroProps {
  dragonName: string
  childName: string
}

export function DragonAchievementsIntro({ dragonName, childName }: DragonAchievementsIntroProps) {
  const headline = childName.trim()
    ? `Here's what ${childName} can achieve!`
    : "Here's what you can achieve!"

  return (
    <div className="flex flex-1 flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 flex items-start gap-3"
      >
        <DragonCompanion state="demonstrating" size="sm" className="mt-1 shrink-0" />
        <div className="relative flex-1">
          <div className="rounded-2xl border-2 border-forest/10 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(27,58,45,0.08)]">
            <p className="text-base font-bold leading-snug text-forest/80">
              {headline}
            </p>
            <p className="mt-1 text-xs font-semibold text-forest/50">
              — {dragonName}
            </p>
          </div>
          <div className="absolute -left-1 top-5 h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-forest/10 bg-white" />
        </div>
      </motion.div>

      <ul className="flex flex-col">
        {achievements.map((item, index) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.12, duration: 0.35 }}
            className={[
              'flex items-center gap-4 py-5',
              index < achievements.length - 1 ? 'border-b border-forest/10' : '',
            ].join(' ')}
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cloud text-2xl"
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="text-left">
              <p className="text-base font-black text-forest">{item.title}</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-forest/55">
                {item.description}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      <ProgressPreviewChart childName={childName} />
    </div>
  )
}

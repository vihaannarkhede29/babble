import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DragonCompanion } from '../dragon/DragonCompanion'

interface DailyQuestCardProps {
  dragonName: string
  childName: string
  wordsToday: number
  dailyGoal: number
}

export function DailyQuestCard({
  dragonName,
  childName,
  wordsToday,
  dailyGoal,
}: DailyQuestCardProps) {
  const xpGoal = dailyGoal * 25
  const xpEarned = wordsToday * 25
  const progress = Math.min(100, (wordsToday / dailyGoal) * 100)

  return (
    <div className="card-tactile overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-forest/10 px-4 py-3">
        <span className="text-sm font-black text-forest">Daily quest</span>
        <span className="text-xs font-bold text-dragon-teal">+{xpGoal} XP</span>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunshine/30 text-xl">
            ⚡
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-forest">
              Help {dragonName} learn {dailyGoal} words
            </p>
            <p className="mt-0.5 text-xs font-semibold text-forest/50">
              {childName}&apos;s practice goal for today
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-forest/10">
              <motion.div
                className="h-full rounded-full bg-sunshine"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-1.5 text-xs font-bold text-forest/60">
              {xpEarned}/{xpGoal} XP · {wordsToday}/{dailyGoal} words
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface LearnRightPanelProps {
  dragonName: string
  childName: string
  wordsToday: number
  dailyGoal: number
  deprioritizedCount: number
}

export function LearnRightPanel({
  dragonName,
  childName,
  wordsToday,
  dailyGoal,
  deprioritizedCount,
}: LearnRightPanelProps) {
  return (
    <aside className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
      <DailyQuestCard
        dragonName={dragonName}
        childName={childName}
        wordsToday={wordsToday}
        dailyGoal={dailyGoal}
      />

      {deprioritizedCount > 0 && (
        <div className="card-tactile p-4 text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span className="text-sm font-black text-forest">Coming later</span>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-forest/60">
            {deprioritizedCount} word{deprioritizedCount === 1 ? '' : 's'} unlock after easier
            sounds feel comfortable — {dragonName} will let you know!
          </p>
        </div>
      )}

      <div className="card-tactile flex flex-col items-center gap-3 p-5">
        <DragonCompanion state="waving" size="md" />
        <p className="text-center text-sm font-bold text-forest">
          {wordsToday >= dailyGoal
            ? `${dragonName} is so proud of you, ${childName}!`
            : `Keep going, ${childName}! ${dragonName} is cheering!`}
        </p>
      </div>

      <Link
        to="/dashboard"
        className="btn-pressable hidden rounded-xl border-2 border-forest/10 bg-white py-3 text-center text-sm font-bold text-forest/70 shadow-sm lg:block"
      >
        Parent progress report →
      </Link>
    </aside>
  )
}

interface UnitBannerProps {
  dragonName: string
  childName: string
}

export function UnitBanner({ dragonName, childName }: UnitBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-forest to-[#2a5c45] px-5 py-4 text-white shadow-lg">
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">
          Section 1 · First words
        </p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">
          Teach {dragonName} with {childName}
        </h2>
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 right-8 h-16 w-16 rounded-full bg-sunshine/20" />
    </div>
  )
}

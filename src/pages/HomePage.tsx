import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LearnNav, LearnStatsBar } from '../components/learn/LearnNav'
import { LearningPath } from '../components/learn/LearningPath'
import { LearnRightPanel, UnitBanner } from '../components/learn/LearnWidgets'
import { useChildProfile } from '../hooks/useChildProfile'
import { useLocalProgress } from '../hooks/useLocalProgress'
import { buildLearningPath, computeSessionXp } from '../lib/learnPath'

export function HomePage() {
  const navigate = useNavigate()
  const { taughtCount, getWordStatus } = useLocalProgress()
  const {
    profile,
    recommendedWords,
    deprioritizedWords,
    dailyGoal,
  } = useChildProfile()

  const dragonName = profile.dragonName.trim() || 'Blaze'
  const childName = profile.childName.trim() || 'friend'

  const pathNodes = useMemo(
    () => buildLearningPath(recommendedWords, deprioritizedWords, getWordStatus),
    [recommendedWords, deprioritizedWords, getWordStatus],
  )

  const xp = computeSessionXp(taughtCount)
  const streak = taughtCount > 0 ? 1 : 0

  return (
    <div className="flex min-h-svh flex-col bg-cloud lg:flex-row">
      <LearnNav />

      <div className="flex flex-1 flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-24 pt-4 lg:max-w-none lg:pb-6 lg:pt-0">
          <div className="mb-5 lg:hidden">
            <span className="text-xl font-black text-dragon-teal">PhonicsForge</span>
          </div>

          <div className="mb-6">
            <LearnStatsBar
              xp={xp}
              streak={streak}
              wordsToday={taughtCount}
              dailyGoal={dailyGoal}
              sessionMinutes={profile.sessionLengthMinutes}
            />
          </div>

          <UnitBanner dragonName={dragonName} childName={childName} />

          <div className="mt-8 flex flex-col lg:flex-row lg:gap-8">
            <div className="flex-1">
              <LearningPath
                nodes={pathNodes}
                onSelectWord={(wordId) => navigate(`/practice/${wordId}`)}
              />
            </div>

            <LearnRightPanel
              dragonName={dragonName}
              childName={childName}
              wordsToday={taughtCount}
              dailyGoal={dailyGoal}
              deprioritizedCount={deprioritizedWords.length}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

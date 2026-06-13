import { Link } from 'react-router-dom'
import { AccuracyChart } from '../components/dashboard/AccuracyChart'
import { ExportCsvButton } from '../components/dashboard/ExportCsvButton'
import { WordProgressGrid } from '../components/dashboard/WordProgressGrid'
import { useChildProfile } from '../hooks/useChildProfile'
import { useLocalProgress } from '../hooks/useLocalProgress'

export function DashboardPage() {
  const { accuracyHistory, wordProgress } = useLocalProgress()
  const { profile } = useChildProfile()

  return (
    <div className="mx-auto min-h-svh max-w-3xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-forest">Parent Dashboard</h1>
          <p className="text-sm font-semibold text-forest/70">
            {profile.childName}&apos;s phoneme progress over the last 7 days
          </p>
          <p className="mt-1 text-xs text-forest/50">
            {profile.sessionLengthMinutes}-min sessions
            {profile.challengingSounds.length > 0
              ? ` · Focusing on easier words first (${profile.challengingSounds.join(', ')} on hold)`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCsvButton accuracyHistory={accuracyHistory} wordProgress={wordProgress} />
          <Link
            to="/"
            className="btn-pressable rounded-xl bg-white px-4 py-3 text-sm font-bold text-forest shadow-md"
          >
            Back to app
          </Link>
        </div>
      </header>

      <section className="card-tactile mb-8 p-6">
        <h2 className="mb-4 text-lg font-bold text-forest">Phoneme Accuracy</h2>
        <AccuracyChart data={accuracyHistory} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-forest">Word Progress</h2>
        <WordProgressGrid wordProgress={wordProgress} />
      </section>
    </div>
  )
}

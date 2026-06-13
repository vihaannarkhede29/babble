import type { AccuracyDataPoint, WordProgress } from '../../lib/mockProgress'
import { buildCsvExport } from '../../lib/mockProgress'

interface ExportCsvButtonProps {
  accuracyHistory: AccuracyDataPoint[]
  wordProgress: WordProgress[]
}

export function ExportCsvButton({ accuracyHistory, wordProgress }: ExportCsvButtonProps) {
  const handleExport = () => {
    const csv = buildCsvExport(accuracyHistory, wordProgress)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `phonicsforge-progress-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      className="btn-pressable rounded-xl bg-forest px-5 py-3 text-sm font-bold text-cloud shadow-md"
      onClick={handleExport}
    >
      Export CSV
    </button>
  )
}

import { WORDS } from './words'

export type WordStatus = 'mastered' | 'in-progress' | 'not-started'

export interface AccuracyDataPoint {
  day: string
  accuracy: number
}

export interface WordProgress {
  wordId: string
  status: WordStatus
  attempts: number
  accuracy: number
}

export const defaultAccuracyHistory: AccuracyDataPoint[] = [
  { day: 'Mon', accuracy: 62 },
  { day: 'Tue', accuracy: 68 },
  { day: 'Wed', accuracy: 71 },
  { day: 'Thu', accuracy: 75 },
  { day: 'Fri', accuracy: 78 },
  { day: 'Sat', accuracy: 82 },
  { day: 'Sun', accuracy: 85 },
]

export const defaultWordProgress: WordProgress[] = [
  { wordId: 'sun', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'cat', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'fish', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'star', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'frog', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'tree', status: 'not-started', attempts: 0, accuracy: 0 },
  { wordId: 'bath', status: 'not-started', attempts: 0, accuracy: 0 },
]

export function starsFromAttempts(attempts: number): number {
  if (attempts <= 1) return 3
  if (attempts <= 3) return 2
  return 1
}

export function xpFromStars(stars: number): number {
  return stars * 25
}

export function buildCsvExport(
  accuracyHistory: AccuracyDataPoint[],
  wordProgress: WordProgress[],
): string {
  const lines = ['PhonicsForge Progress Report', '']

  lines.push('Daily Accuracy (Last 7 Days)')
  lines.push('Day,Accuracy %')
  accuracyHistory.forEach(({ day, accuracy }) => {
    lines.push(`${day},${accuracy}`)
  })

  lines.push('')
  lines.push('Word Progress')
  lines.push('Word,Status,Attempts,Accuracy %')
  wordProgress.forEach(({ wordId, status, attempts, accuracy }) => {
    const label = WORDS.find((w) => w.id === wordId)?.label ?? wordId
    lines.push(`${label},${status},${attempts},${accuracy}`)
  })

  return lines.join('\n')
}

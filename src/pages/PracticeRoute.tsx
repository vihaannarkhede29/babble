// PracticeRoute.tsx — Route wrapper for the Coach. Reads an optional :wordId from
// the URL (set when the child taps a word on Home) and preselects it.

import { useParams } from 'react-router-dom'
import { WordPractice } from '../components/WordPractice'

export function PracticeRoute() {
  const { wordId } = useParams()
  return <WordPractice initialWordId={wordId} />
}

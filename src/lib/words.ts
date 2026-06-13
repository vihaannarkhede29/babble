export type WordImage = 'cat' | 'sun' | 'frog' | 'fish' | 'tree' | 'bath' | 'star'
export type WordDifficulty = 'easy' | 'medium' | 'hard'

export interface Word {
  id: string
  label: string
  phonemes: string[]
  colors: string[]
  image: WordImage
  containsSounds: string[]
  difficulty: WordDifficulty
}

export const WORDS: Word[] = [
  {
    id: 'sun',
    label: 'SUN',
    phonemes: ['S', 'AH', 'N'],
    colors: ['#3BBFBF', '#FFD166', '#EF6C57'],
    image: 'sun',
    containsSounds: ['S'],
    difficulty: 'easy',
  },
  {
    id: 'cat',
    label: 'CAT',
    phonemes: ['K', 'A', 'T'],
    colors: ['#EF6C57', '#FFD166', '#3BBFBF'],
    image: 'cat',
    containsSounds: [],
    difficulty: 'easy',
  },
  {
    id: 'fish',
    label: 'FISH',
    phonemes: ['F', 'I', 'SH'],
    colors: ['#3BBFBF', '#FFD166', '#EF6C57'],
    image: 'fish',
    containsSounds: ['SH'],
    difficulty: 'easy',
  },
  {
    id: 'star',
    label: 'STAR',
    phonemes: ['S', 'T', 'AR'],
    colors: ['#3BBFBF', '#FFD166', '#EF6C57'],
    image: 'star',
    containsSounds: ['S'],
    difficulty: 'medium',
  },
  {
    id: 'frog',
    label: 'FROG',
    phonemes: ['F', 'R', 'O', 'G'],
    colors: ['#EF6C57', '#3BBFBF', '#FFD166', '#1B3A2D'],
    image: 'frog',
    containsSounds: ['R'],
    difficulty: 'medium',
  },
  {
    id: 'tree',
    label: 'TREE',
    phonemes: ['T', 'R', 'EE'],
    colors: ['#FFD166', '#EF6C57', '#3BBFBF'],
    image: 'tree',
    containsSounds: ['R'],
    difficulty: 'medium',
  },
  {
    id: 'bath',
    label: 'BATH',
    phonemes: ['B', 'A', 'TH'],
    colors: ['#3BBFBF', '#FFD166', '#EF6C57'],
    image: 'bath',
    containsSounds: ['TH'],
    difficulty: 'hard',
  },
]

export function getWordById(id: string): Word | undefined {
  return WORDS.find((word) => word.id === id)
}

export function speakWord(label: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(label.toLowerCase())
  utterance.rate = 0.85
  utterance.pitch = 1.1
  window.speechSynthesis.speak(utterance)
}

export function speakPhonemes(phonemes: string[]) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const text = phonemes.join(' ').toLowerCase()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.75
  utterance.pitch = 1.1
  window.speechSynthesis.speak(utterance)
}

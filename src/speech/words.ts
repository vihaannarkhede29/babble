// words.ts — The starter word set for the speech-recognition Practice flow.
//
// We recognise whole WORDS (via the browser's Speech API) rather than isolated
// phonemes — words are far easier for a pre-reader to say and for an ASR engine
// to get right. Each word still teaches one focus sound, and maps to an existing
// phoneme id so the XP/mastery dashboard keeps working unchanged.
//
// `accept` lists homophones the recogniser may legitimately return for a
// correctly-said word (e.g. "son" for "sun") — counted as fully correct.
// `nearMiss` maps a likely misrecognition to the sound that slipped, for
// targeted coaching.

export interface PracticeWord {
  id: string
  word: string
  emoji: string
  /** Existing phoneme id (audio/phonemes.ts) for store/dashboard continuity. */
  focusPhonemeId: string
  /** Friendly label for the focus sound, e.g. "SH". */
  focusLabel: string
  /** Rough phoneme breakdown, for feedback/display. */
  phonemes: string[]
  /** Index into `phonemes` of the sound being taught (highlighted in the matrix). */
  focusIndex: number
  /** Homophones / equivalents that count as a correct attempt. */
  accept: string[]
  /** Common misrecognitions → which focus sound they indicate was off. */
  nearMiss: string[]
}

export const WORDS: PracticeWord[] = [
  {
    id: 'sun',
    word: 'sun',
    emoji: '☀️',
    focusPhonemeId: 's',
    focusLabel: 'SSS',
    phonemes: ['s', 'ʌ', 'n'],
    focusIndex: 0,
    accept: ['son'], // homophone
    nearMiss: ['fun', 'sub', 'sin', 'bun'],
  },
  {
    id: 'ship',
    word: 'ship',
    emoji: '🚢',
    focusPhonemeId: 'sh',
    focusLabel: 'SH',
    phonemes: ['ʃ', 'ɪ', 'p'],
    focusIndex: 0,
    accept: [],
    nearMiss: ['sip', 'chip', 'shop', 'sheep'], // "sip" = the /ʃ/→/s/ lisp
  },
  {
    id: 'sheep',
    word: 'sheep',
    emoji: '🐑',
    focusPhonemeId: 'iy',
    focusLabel: 'EE',
    phonemes: ['ʃ', 'iː', 'p'],
    focusIndex: 1,
    accept: [],
    nearMiss: ['ship', 'sleep', 'cheap', 'sheet'],
  },
  {
    id: 'red',
    word: 'red',
    emoji: '🔴',
    focusPhonemeId: 'eh',
    focusLabel: 'EH',
    phonemes: ['r', 'ɛ', 'd'],
    focusIndex: 1,
    accept: ['read'], // past-tense "read" is a homophone of "red"
    nearMiss: ['wed', 'bread', 'rad', 'ride'],
  },
  {
    id: 'moon',
    word: 'moon',
    emoji: '🌙',
    focusPhonemeId: 'uw',
    focusLabel: 'OO',
    phonemes: ['m', 'uː', 'n'],
    focusIndex: 1,
    accept: [],
    nearMiss: ['moo', 'noon', 'mood', 'man'],
  },
]

export function getWord(id: string): PracticeWord | undefined {
  return WORDS.find((w) => w.id === id)
}

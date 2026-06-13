// words.ts — The practice word set for the speech-recognition Coach.
//
// We recognise whole WORDS (via the browser's Speech API) rather than isolated
// phonemes — words are far easier for a pre-reader to say and for an ASR engine
// to get right. Each word teaches one focus sound and maps to an existing
// phoneme id (audio/phonemes.ts) so the XP/mastery dashboard stays coherent.
//
// Every focusPhonemeId is one of the 8 catalogued sounds (6 vowels + /s/, /ʃ/);
// we get word *variety* by having many words per sound, which is what makes the
// today / tomorrow / this-week scheduler (wordSchedule.ts) feel fresh.
//
// `accept` lists homophones counted as fully correct; `nearMiss` maps likely
// misrecognitions to the sound that slipped, for targeted coaching.

export interface PracticeWord {
  id: string
  word: string
  emoji: string
  /** Existing phoneme id (audio/phonemes.ts) for store/dashboard continuity. */
  focusPhonemeId: string
  /** Friendly label for the focus sound, e.g. "SH". */
  focusLabel: string
  /** Rough phoneme breakdown (IPA tokens), for the matrix/articulation. */
  phonemes: string[]
  /** Index into `phonemes` of the sound being taught (highlighted). */
  focusIndex: number
  /** Homophones / equivalents that count as a correct attempt. */
  accept: string[]
  /** Common misrecognitions → which focus sound they indicate was off. */
  nearMiss: string[]
}

// Helper keeps the table terse and the optional fields honest.
const w = (
  id: string,
  word: string,
  emoji: string,
  focusPhonemeId: string,
  focusLabel: string,
  phonemes: string[],
  focusIndex: number,
  accept: string[] = [],
  nearMiss: string[] = [],
): PracticeWord => ({ id, word, emoji, focusPhonemeId, focusLabel, phonemes, focusIndex, accept, nearMiss })

export const WORDS: PracticeWord[] = [
  // EE  /iː/
  w('sheep', 'sheep', '🐑', 'iy', 'EE', ['ʃ', 'iː', 'p'], 1, [], ['ship', 'sleep', 'cheap']),
  w('bee', 'bee', '🐝', 'iy', 'EE', ['b', 'iː'], 1, ['be'], ['bee']),
  w('tree', 'tree', '🌲', 'iy', 'EE', ['t', 'r', 'iː'], 2, [], ['free', 'three']),
  w('key', 'key', '🔑', 'iy', 'EE', ['k', 'iː'], 1, ['quay'], ['kay']),
  w('green', 'green', '💚', 'iy', 'EE', ['g', 'r', 'iː', 'n'], 2, [], ['grin']),
  w('leaf', 'leaf', '🍃', 'iy', 'EE', ['l', 'iː', 'f'], 1, [], ['life']),

  // EH  /ɛ/
  w('red', 'red', '🔴', 'eh', 'EH', ['r', 'ɛ', 'd'], 1, ['read'], ['wed', 'bread', 'rad']),
  w('bed', 'bed', '🛏️', 'eh', 'EH', ['b', 'ɛ', 'd'], 1, [], ['bad', 'bead']),
  w('egg', 'egg', '🥚', 'eh', 'EH', ['ɛ', 'g'], 0, [], ['eg']),
  w('web', 'web', '🕸️', 'eh', 'EH', ['w', 'ɛ', 'b'], 1, [], ['web']),
  w('hen', 'hen', '🐔', 'eh', 'EH', ['h', 'ɛ', 'n'], 1, [], ['hand', 'hand']),

  // AA  /æ/
  w('cat', 'cat', '🐱', 'ae', 'AA', ['k', 'æ', 't'], 1, [], ['cot', 'cut', 'kite']),
  w('hat', 'hat', '🎩', 'ae', 'AA', ['h', 'æ', 't'], 1, [], ['hot', 'hut']),
  w('bag', 'bag', '🎒', 'ae', 'AA', ['b', 'æ', 'g'], 1, [], ['big', 'bug', 'bag']),
  w('flag', 'flag', '🚩', 'ae', 'AA', ['f', 'l', 'æ', 'g'], 2, [], ['flog']),
  w('apple', 'apple', '🍎', 'ae', 'AA', ['æ', 'p', 'ə', 'l'], 0, [], []),

  // AH  /ɑː/
  w('hot', 'hot', '🔥', 'aa', 'AH', ['h', 'ɑː', 't'], 1, [], ['hat', 'hut']),
  w('pot', 'pot', '🍲', 'aa', 'AH', ['p', 'ɑː', 't'], 1, [], ['pat', 'put', 'pet']),
  w('dog', 'dog', '🐶', 'aa', 'AH', ['d', 'ɑː', 'g'], 1, [], ['dig', 'dug']),
  w('sock', 'sock', '🧦', 'aa', 'AH', ['s', 'ɑː', 'k'], 1, [], ['sack', 'suck']),
  w('box', 'box', '📦', 'aa', 'AH', ['b', 'ɑː', 'k', 's'], 1, [], ['backs', 'bucks']),

  // OH  /oʊ/
  w('boat', 'boat', '⛵', 'ow', 'OH', ['b', 'oʊ', 't'], 1, [], ['bot', 'but', 'bought']),
  w('goat', 'goat', '🐐', 'ow', 'OH', ['g', 'oʊ', 't'], 1, [], ['got', 'gut']),
  w('snow', 'snow', '❄️', 'ow', 'OH', ['s', 'n', 'oʊ'], 2, [], ['now', 'no']),
  w('rose', 'rose', '🌹', 'ow', 'OH', ['r', 'oʊ', 'z'], 1, ['rows'], ['raise']),
  w('bone', 'bone', '🦴', 'ow', 'OH', ['b', 'oʊ', 'n'], 1, [], ['ban', 'bun']),

  // OO  /uː/
  w('moon', 'moon', '🌙', 'uw', 'OO', ['m', 'uː', 'n'], 1, [], ['moo', 'noon', 'man']),
  w('spoon', 'spoon', '🥄', 'uw', 'OO', ['s', 'p', 'uː', 'n'], 2, [], ['spin']),
  w('shoe', 'shoe', '👟', 'uw', 'OO', ['ʃ', 'uː'], 1, ['shoo'], ['she', 'show']),
  w('blue', 'blue', '🔵', 'uw', 'OO', ['b', 'l', 'uː'], 2, ['blew'], ['blow']),
  w('boot', 'boot', '🥾', 'uw', 'OO', ['b', 'uː', 't'], 1, [], ['bot', 'bought', 'but']),

  // SSS  /s/
  w('sun', 'sun', '☀️', 's', 'SSS', ['s', 'ʌ', 'n'], 0, ['son'], ['fun', 'sub', 'bun']),
  w('snake', 'snake', '🐍', 's', 'SSS', ['s', 'n', 'eɪ', 'k'], 0, [], ['shake', 'sake']),
  w('bus', 'bus', '🚌', 's', 'SSS', ['b', 'ʌ', 's'], 2, [], ['buzz', 'bun', 'bus']),
  w('soup', 'soup', '🥣', 's', 'SSS', ['s', 'uː', 'p'], 0, [], ['shoop', 'sup']),
  w('star', 'star', '⭐', 's', 'SSS', ['s', 't', 'ɑː', 'r'], 0, [], ['car', 'tar']),

  // SH  /ʃ/
  w('ship', 'ship', '🚢', 'sh', 'SH', ['ʃ', 'ɪ', 'p'], 0, [], ['sip', 'chip', 'sheep']),
  w('fish', 'fish', '🐟', 'sh', 'SH', ['f', 'ɪ', 'ʃ'], 2, [], ['fis', 'fizz']),
  w('shell', 'shell', '🐚', 'sh', 'SH', ['ʃ', 'ɛ', 'l'], 0, [], ['sell', 'cell']),
  w('brush', 'brush', '🪥', 'sh', 'SH', ['b', 'r', 'ʌ', 'ʃ'], 3, [], ['brus']),
]

export function getWord(id: string): PracticeWord | undefined {
  return WORDS.find((x) => x.id === id)
}

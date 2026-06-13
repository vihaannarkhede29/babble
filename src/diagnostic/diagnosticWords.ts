// diagnosticWords.ts — The "Teach Blaze His First Words" word bank.
//
// 26 illustrated words chosen so that, between them, every major English phoneme
// is assessed at least once. Displayed in mixed order so it never feels like a
// drill. `tests` are the target sounds this word screens for (the child says the
// whole word; we infer how those sounds went from the recognition result).
//
// Tokens are ARPABET-ish; phonemeTokens.ts maps them to our IPA articulation set.

export interface DiagnosticWord {
  word: string
  emoji: string
  phonemes: string[]
  /** Target sounds this word screens for. */
  tests: string[]
}

export const DIAGNOSTIC_WORDS: DiagnosticWord[] = [
  // Vowels
  { word: 'EGG', emoji: '🥚', phonemes: ['EH', 'G'], tests: ['EH'] },
  { word: 'ICE', emoji: '🧊', phonemes: ['AY', 'S'], tests: ['AY'] },
  { word: 'OAK', emoji: '🌳', phonemes: ['OH', 'K'], tests: ['OH'] },
  { word: 'UP', emoji: '⬆️', phonemes: ['AH', 'P'], tests: ['AH'] },
  { word: 'EEL', emoji: '🐍', phonemes: ['EE', 'L'], tests: ['EE'] },
  { word: 'OOH', emoji: '😮', phonemes: ['OO'], tests: ['OO'] },
  { word: 'ATE', emoji: '8️⃣', phonemes: ['AY', 'T'], tests: ['AY'] },

  // Consonants — stops
  { word: 'PIG', emoji: '🐷', phonemes: ['P', 'IH', 'G'], tests: ['P', 'G'] },
  { word: 'BED', emoji: '🛏️', phonemes: ['B', 'EH', 'D'], tests: ['B', 'D'] },
  { word: 'CAT', emoji: '🐱', phonemes: ['K', 'AE', 'T'], tests: ['K', 'T'] },

  // Consonants — fricatives
  { word: 'SUN', emoji: '☀️', phonemes: ['S', 'AH', 'N'], tests: ['S'] },
  { word: 'FAN', emoji: '🌀', phonemes: ['F', 'AE', 'N'], tests: ['F'] },
  { word: 'VAN', emoji: '🚐', phonemes: ['V', 'AE', 'N'], tests: ['V'] },
  { word: 'ZAP', emoji: '⚡', phonemes: ['Z', 'AE', 'P'], tests: ['Z'] },

  // Consonants — affricates
  { word: 'CHIP', emoji: '🍟', phonemes: ['CH', 'IH', 'P'], tests: ['CH'] },
  { word: 'JAR', emoji: '🫙', phonemes: ['J', 'AH', 'R'], tests: ['J'] },

  // Consonants — nasals
  { word: 'MAP', emoji: '🗺️', phonemes: ['M', 'AE', 'P'], tests: ['M'] },
  { word: 'NET', emoji: '🥅', phonemes: ['N', 'EH', 'T'], tests: ['N'] },
  { word: 'RING', emoji: '💍', phonemes: ['R', 'IH', 'NG'], tests: ['NG'] },

  // Consonants — liquids
  { word: 'LEG', emoji: '🦵', phonemes: ['L', 'EH', 'G'], tests: ['L'] },
  { word: 'RUN', emoji: '🏃', phonemes: ['R', 'AH', 'N'], tests: ['R'] },

  // Digraphs
  { word: 'SHIP', emoji: '🚢', phonemes: ['SH', 'IH', 'P'], tests: ['SH'] },
  { word: 'THIN', emoji: '📏', phonemes: ['TH', 'IH', 'N'], tests: ['TH'] },
  { word: 'WHIP', emoji: '🌀', phonemes: ['WH', 'IH', 'P'], tests: ['WH'] },

  // Blends
  { word: 'FROG', emoji: '🐸', phonemes: ['F', 'R', 'AO', 'G'], tests: ['FR'] },
  { word: 'TREE', emoji: '🌲', phonemes: ['T', 'R', 'EE'], tests: ['TR'] },
  { word: 'SLIP', emoji: '🧼', phonemes: ['S', 'L', 'IH', 'P'], tests: ['SL'] },
]

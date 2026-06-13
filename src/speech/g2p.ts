// g2p.ts — A small, original, rule-based grapheme→phoneme converter.
//
// English spelling is irregular, so this is a BEST-GUESS breakdown (an exception
// list patches the most common irregular words). It only powers the on-screen
// breakdown + which sound to coach — the actual pronunciation grade comes from
// speech recognition, which works on the real word regardless. Tokens are the
// IPA-ish set used by articulation.ts so every one has a mouth cue.

/** Common irregular words the rules would get wrong. */
const EXCEPTIONS: Record<string, string[]> = {
  the: ['ð', 'ə'], a: ['ə'], i: ['aɪ'], to: ['t', 'uː'], do: ['d', 'uː'],
  you: ['y', 'uː'], are: ['ɑː', 'r'], one: ['w', 'ʌ', 'n'], two: ['t', 'uː'],
  said: ['s', 'ɛ', 'd'], of: ['ʌ', 'v'], was: ['w', 'ʌ', 'z'], is: ['ɪ', 'z'],
  he: ['h', 'iː'], she: ['ʃ', 'iː'], we: ['w', 'iː'], me: ['m', 'iː'], be: ['b', 'iː'],
  go: ['g', 'oʊ'], so: ['s', 'oʊ'], no: ['n', 'oʊ'], my: ['m', 'aɪ'], by: ['b', 'aɪ'],
  water: ['w', 'ɔ', 't', 'ɝ'], come: ['k', 'ʌ', 'm'], some: ['s', 'ʌ', 'm'],
  love: ['l', 'ʌ', 'v'], have: ['h', 'æ', 'v'], give: ['g', 'ɪ', 'v'], live: ['l', 'ɪ', 'v'],
  who: ['h', 'uː'], what: ['w', 'ʌ', 't'], want: ['w', 'ɑː', 'n', 't'],
  dog: ['d', 'ɔ', 'g'], cat: ['k', 'æ', 't'], car: ['k', 'ɑː', 'r'],
}

/** Multi-letter graphemes, tried longest-first. [] = silent. */
const GRAPHEMES: [string, string[]][] = [
  ['tch', ['tʃ']], ['dge', ['dʒ']], ['igh', ['aɪ']],
  ['sh', ['ʃ']], ['ch', ['tʃ']], ['th', ['θ']], ['ph', ['f']], ['wh', ['w']],
  ['ck', ['k']], ['ng', ['ŋ']], ['qu', ['k', 'w']], ['gh', []],
  ['ee', ['iː']], ['ea', ['iː']], ['oo', ['uː']], ['oa', ['oʊ']], ['ow', ['oʊ']],
  ['ai', ['eɪ']], ['ay', ['eɪ']], ['oy', ['ɔɪ']], ['oi', ['ɔɪ']], ['ou', ['aʊ']],
  ['ar', ['ɑː', 'r']], ['or', ['ɔ', 'r']], ['er', ['ɝ']], ['ir', ['ɝ']], ['ur', ['ɝ']],
]

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])
const SINGLE: Record<string, string[]> = {
  a: ['æ'], e: ['ɛ'], i: ['ɪ'], o: ['ɑː'], u: ['ʌ'],
  b: ['b'], c: ['k'], d: ['d'], f: ['f'], g: ['g'], h: ['h'], j: ['dʒ'], k: ['k'],
  l: ['l'], m: ['m'], n: ['n'], p: ['p'], q: ['k'], r: ['r'], s: ['s'], t: ['t'],
  v: ['v'], w: ['w'], x: ['k', 's'], y: ['j'], z: ['z'],
}
/** Long vowels for "magic e" (cake, bike, hope, cute). */
const LONG: Record<string, string> = { a: 'eɪ', e: 'iː', i: 'aɪ', o: 'oʊ', u: 'uː' }

/** Sounds worth coaching, in priority order (the focus picker prefers these). */
const TARGET_PRIORITY = ['r', 'θ', 'ð', 'ʃ', 'ʒ', 's', 'z', 'l', 'tʃ', 'dʒ', 'f', 'v']

export interface Breakdown {
  phonemes: string[]
  focusIndex: number
}

/** Convert a single lowercase word into a best-guess phoneme breakdown. */
export function wordToPhonemes(raw: string): Breakdown {
  const word = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (EXCEPTIONS[word]) return withFocus(EXCEPTIONS[word])

  // "magic e": a final silent e usually lengthens the previous vowel (cake→eɪ).
  let w = word
  let magic = false
  if (
    w.length >= 3 &&
    w.endsWith('e') &&
    !VOWELS.has(w[w.length - 2]) &&
    VOWELS.has(w[w.length - 3])
  ) {
    magic = true
    w = w.slice(0, -1) // drop silent e
  }

  const out: string[] = []
  let i = 0
  while (i < w.length) {
    // try multi-letter graphemes
    let matched = false
    for (const [g, toks] of GRAPHEMES) {
      if (w.startsWith(g, i)) {
        out.push(...toks)
        i += g.length
        matched = true
        break
      }
    }
    if (matched) continue

    const ch = w[i]
    const next = w[i + 1] ?? ''
    // soft c / g before e, i, y  (explicit list — note ''.includes is truthy!)
    const soft = next === 'e' || next === 'i' || next === 'y'
    if (ch === 'c' && soft) out.push('s')
    else if (ch === 'g' && soft) out.push('dʒ')
    else if (ch === 'y' && i > 0 && !VOWELS.has(w[i - 1])) out.push('iː') // y-as-vowel (happy, baby)
    else if (VOWELS.has(ch) && magic && i === lastVowelIndex(w)) out.push(LONG[ch])
    else out.push(...(SINGLE[ch] ?? []))
    i += 1
  }

  // collapse accidental empties / doubled identical consonants
  const cleaned = out.filter(Boolean)
  return withFocus(cleaned.length ? cleaned : ['ʌ'])
}

function lastVowelIndex(w: string): number {
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.has(w[i])) return i
  return -1
}

/** Pick the most coach-worthy sound as the focus. */
function withFocus(phonemes: string[]): Breakdown {
  for (const target of TARGET_PRIORITY) {
    const idx = phonemes.indexOf(target)
    if (idx >= 0) return { phonemes, focusIndex: idx }
  }
  // else first consonant, else first sound
  const consonant = phonemes.findIndex((p) => !'iː,ɪ,ɛ,æ,ʌ,ɑː,ɔ,oʊ,uː,eɪ,aɪ,aʊ,ɔɪ,ə,ɝ'.split(',').includes(p))
  return { phonemes, focusIndex: consonant >= 0 ? consonant : 0 }
}

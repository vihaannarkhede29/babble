// articulation.ts — How each sound is physically made, for the front-view mouth.
//
// These are the targets the animated ArticulationFace interpolates toward. The
// continuous values (0..1) describe the visible mouth; `tongue`/`airflow` pick a
// discrete cue; `cue` is the child-facing instruction shown on a miss.
//
// Keyed by a simple phoneme token (ARPABET-ish / our phoneme ids), so both the
// 5 starter words and any custom word's breakdown can look one up.

export type TongueCue = 'hidden' | 'tip-teeth' | 'tip-up' | 'back'
export type AirflowCue = 'stream' | 'burst' | 'voiced' | 'none'

export interface Articulation {
  label: string
  /** 0 = narrow/round lips … 1 = wide smile. */
  width: number
  /** 0 = closed … 1 = wide open. */
  open: number
  /** 0 = flat … 1 = lips pushed forward (oo, sh, w). */
  protrude: number
  /** 0 = teeth apart … 1 = teeth together & showing (s, f). */
  teeth: number
  tongue: TongueCue
  airflow: AirflowCue
  cue: string
}

const A = (a: Articulation) => a

// Map covers the focus sounds plus the consonants/vowels a typed word may need.
// Keys are matched case-insensitively against phoneme tokens (IPA and ARPABET).
const TABLE: Record<string, Articulation> = {
  // --- sibilants / fricatives ---
  s: A({ label: 'S', width: 0.65, open: 0.16, protrude: 0, teeth: 0.95, tongue: 'tip-up', airflow: 'stream', cue: 'Teeth together, smile a little, push air — sssss 🐍' }),
  z: A({ label: 'Z', width: 0.65, open: 0.16, protrude: 0, teeth: 0.95, tongue: 'tip-up', airflow: 'voiced', cue: 'Like S but buzz your voice — zzz' }),
  'ʃ': A({ label: 'SH', width: 0.3, open: 0.2, protrude: 0.85, teeth: 0.6, tongue: 'back', airflow: 'stream', cue: 'Round your lips and push them out — shhh 🤫' }),
  sh: A({ label: 'SH', width: 0.3, open: 0.2, protrude: 0.85, teeth: 0.6, tongue: 'back', airflow: 'stream', cue: 'Round your lips and push them out — shhh 🤫' }),
  'ʒ': A({ label: 'ZH', width: 0.3, open: 0.2, protrude: 0.85, teeth: 0.6, tongue: 'back', airflow: 'voiced', cue: 'Like SH but with your voice on' }),
  f: A({ label: 'F', width: 0.55, open: 0.12, protrude: 0, teeth: 0.5, tongue: 'hidden', airflow: 'stream', cue: 'Top teeth gently on your lip, blow — fff' }),
  v: A({ label: 'V', width: 0.55, open: 0.12, protrude: 0, teeth: 0.5, tongue: 'hidden', airflow: 'voiced', cue: 'Like F but buzz — vvv' }),
  'θ': A({ label: 'TH', width: 0.5, open: 0.22, protrude: 0, teeth: 0.3, tongue: 'tip-teeth', airflow: 'stream', cue: 'Tongue tip between your teeth, blow soft — th' }),
  th: A({ label: 'TH', width: 0.5, open: 0.22, protrude: 0, teeth: 0.3, tongue: 'tip-teeth', airflow: 'stream', cue: 'Tongue tip between your teeth, blow soft — th' }),
  'ð': A({ label: 'TH', width: 0.5, open: 0.22, protrude: 0, teeth: 0.3, tongue: 'tip-teeth', airflow: 'voiced', cue: 'Tongue between teeth, hum — the' }),
  h: A({ label: 'H', width: 0.55, open: 0.45, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'stream', cue: 'Open and breathe out — hhh' }),

  // --- approximants / nasals ---
  r: A({ label: 'R', width: 0.4, open: 0.32, protrude: 0.45, teeth: 0.2, tongue: 'back', airflow: 'voiced', cue: 'Curl your tongue up and back — rrr' }),
  l: A({ label: 'L', width: 0.5, open: 0.4, protrude: 0, teeth: 0.1, tongue: 'tip-up', airflow: 'voiced', cue: 'Tongue tip up behind your top teeth — lll' }),
  w: A({ label: 'W', width: 0.2, open: 0.22, protrude: 0.9, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Tiny round lips, then open — wuh' }),
  y: A({ label: 'Y', width: 0.85, open: 0.3, protrude: 0, teeth: 0.3, tongue: 'tip-up', airflow: 'voiced', cue: 'Smile, tongue high — yuh' }),
  m: A({ label: 'M', width: 0.45, open: 0.02, protrude: 0.1, teeth: 0, tongue: 'hidden', airflow: 'voiced', cue: 'Lips together, hum — mmm' }),
  n: A({ label: 'N', width: 0.5, open: 0.18, protrude: 0, teeth: 0.2, tongue: 'tip-up', airflow: 'voiced', cue: 'Tongue tip up, hum — nnn' }),
  'ŋ': A({ label: 'NG', width: 0.5, open: 0.2, protrude: 0, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Back of tongue up — ng' }),

  // --- plosives ---
  p: A({ label: 'P', width: 0.45, open: 0.03, protrude: 0.1, teeth: 0, tongue: 'hidden', airflow: 'burst', cue: 'Lips together, then pop — puh' }),
  b: A({ label: 'B', width: 0.45, open: 0.03, protrude: 0.1, teeth: 0, tongue: 'hidden', airflow: 'burst', cue: 'Lips together, pop with voice — buh' }),
  t: A({ label: 'T', width: 0.5, open: 0.12, protrude: 0, teeth: 0.3, tongue: 'tip-up', airflow: 'burst', cue: 'Tongue tip taps behind teeth — tuh' }),
  d: A({ label: 'D', width: 0.5, open: 0.12, protrude: 0, teeth: 0.3, tongue: 'tip-up', airflow: 'burst', cue: 'Like T with voice — duh' }),
  k: A({ label: 'K', width: 0.5, open: 0.25, protrude: 0, teeth: 0, tongue: 'back', airflow: 'burst', cue: 'Back of tongue taps — kuh' }),
  g: A({ label: 'G', width: 0.5, open: 0.25, protrude: 0, teeth: 0, tongue: 'back', airflow: 'burst', cue: 'Like K with voice — guh' }),
  'tʃ': A({ label: 'CH', width: 0.35, open: 0.2, protrude: 0.7, teeth: 0.5, tongue: 'tip-up', airflow: 'burst', cue: 'Round lips, sneeze it out — ch' }),
  ch: A({ label: 'CH', width: 0.35, open: 0.2, protrude: 0.7, teeth: 0.5, tongue: 'tip-up', airflow: 'burst', cue: 'Round lips, sneeze it out — ch' }),
  'dʒ': A({ label: 'J', width: 0.35, open: 0.2, protrude: 0.7, teeth: 0.5, tongue: 'tip-up', airflow: 'voiced', cue: 'Like CH with voice — juh' }),

  // --- vowels ---
  'iː': A({ label: 'EE', width: 1.0, open: 0.25, protrude: 0, teeth: 0.4, tongue: 'hidden', airflow: 'voiced', cue: 'Big smile, tongue high — eee 🐑' }),
  'ɪ': A({ label: 'IH', width: 0.8, open: 0.3, protrude: 0, teeth: 0.3, tongue: 'hidden', airflow: 'voiced', cue: 'Small smile, relaxed — ih' }),
  'ɛ': A({ label: 'EH', width: 0.7, open: 0.45, protrude: 0, teeth: 0.2, tongue: 'hidden', airflow: 'voiced', cue: 'Open a little, relax — eh' }),
  'æ': A({ label: 'AA', width: 0.75, open: 0.6, protrude: 0, teeth: 0.1, tongue: 'hidden', airflow: 'voiced', cue: 'Open wide and smile — a (cat)' }),
  'ʌ': A({ label: 'UH', width: 0.55, open: 0.5, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'voiced', cue: 'Relax and open — uh' }),
  'ɑː': A({ label: 'AH', width: 0.6, open: 0.95, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'voiced', cue: 'Open wide, drop your jaw — ahh 🔥' }),
  'ɔ': A({ label: 'AW', width: 0.45, open: 0.6, protrude: 0.5, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Round and open — aw' }),
  'oʊ': A({ label: 'OH', width: 0.35, open: 0.45, protrude: 0.7, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Round your lips — oh ⛵' }),
  'uː': A({ label: 'OO', width: 0.15, open: 0.2, protrude: 0.95, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Tiny round lips, push out — ooo 🌙' }),
  // diphthongs / r-coloured / schwa (mostly from typed words)
  'eɪ': A({ label: 'AY', width: 0.85, open: 0.4, protrude: 0, teeth: 0.2, tongue: 'hidden', airflow: 'voiced', cue: 'Open then smile — ay (cake)' }),
  'aɪ': A({ label: 'EYE', width: 0.7, open: 0.6, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'voiced', cue: 'Open, then glide to a smile — i (bike)' }),
  'aʊ': A({ label: 'OW', width: 0.6, open: 0.6, protrude: 0.5, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Open, then round — ow (cow)' }),
  'ɔɪ': A({ label: 'OY', width: 0.4, open: 0.5, protrude: 0.6, teeth: 0, tongue: 'back', airflow: 'voiced', cue: 'Round, then smile — oy (boy)' }),
  'ə': A({ label: 'UH', width: 0.5, open: 0.35, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'voiced', cue: 'Relax — uh' }),
  'ɝ': A({ label: 'ER', width: 0.45, open: 0.35, protrude: 0.4, teeth: 0.2, tongue: 'back', airflow: 'voiced', cue: 'Curl your tongue — er (bird)' }),
}

const REST: Articulation = {
  label: '', width: 0.5, open: 0.28, protrude: 0, teeth: 0, tongue: 'hidden', airflow: 'none', cue: '',
}

/** Neutral, relaxed mouth — the pose the animation springs back to. */
export function restArticulation(): Articulation {
  return REST
}

/** Look up the articulation for a phoneme token, with a sensible default. */
export function articulationFor(token: string): Articulation {
  const key = token.toLowerCase()
  return TABLE[token] ?? TABLE[key] ?? { ...REST, label: token.toUpperCase() }
}

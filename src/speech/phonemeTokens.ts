// phonemeTokens.ts — Bridge between the two phoneme notations in play.
//
// The partner's data + the diagnostic spec use ARPABET-ish tokens (S, AH, SH,
// TH, EE, AY, NG, …). Our articulation/g2p engine is keyed on IPA (s, ʌ, ʃ, θ,
// iː, aɪ, ŋ, …). This maps ARPABET → IPA so a word written in either notation can
// drive the phoneme matrix and the articulation mouth. It's the glue the merge
// (and the "Teach Blaze" diagnostic) needs.

import { articulationFor } from './articulation'

/** ARPABET-ish (and the spec's friendly vowel tokens) → our IPA token. */
export const ARPA_TO_IPA: Record<string, string> = {
  // vowels (spec uses friendly forms: EH, AY, OH, AH, EE, OO, AE, IH, AO …)
  AA: 'ɑː', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ',
  EH: 'ɛ', ER: 'ɝ', EY: 'eɪ', IH: 'ɪ', IY: 'iː', EE: 'iː',
  OW: 'oʊ', OH: 'oʊ', OY: 'ɔɪ', UH: 'ʌ', UW: 'uː', OO: 'uː',
  // consonants
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'g',
  F: 'f', V: 'v', S: 's', Z: 'z', SH: 'ʃ', ZH: 'ʒ', TH: 'θ', DH: 'ð', HH: 'h', H: 'h',
  CH: 'tʃ', JH: 'dʒ', J: 'dʒ',
  M: 'm', N: 'n', NG: 'ŋ', L: 'l', R: 'r', W: 'w', WH: 'w', Y: 'j',
}

/** Which single sound best represents a consonant blend, for the mouth cue. */
const BLEND_FOCUS: Record<string, string> = {
  FR: 'r', TR: 'r', DR: 'r', BR: 'r', CR: 'r', GR: 'r', PR: 'r',
  SL: 'l', BL: 'l', CL: 'l', FL: 'l', GL: 'l', PL: 'l',
  ST: 's', SP: 's', SK: 's', SN: 's', SM: 's', SW: 's',
}

/** Resolve any token (IPA, ARPABET, or a blend) to an IPA token our engine knows. */
export function toIpaToken(token: string): string {
  if (BLEND_FOCUS[token]) return BLEND_FOCUS[token]
  return ARPA_TO_IPA[token] ?? token.toLowerCase()
}

/** Kid-readable label for any token (reuses the articulation labels). */
export function phonemeLabel(token: string): string {
  return articulationFor(toIpaToken(token)).label || token
}

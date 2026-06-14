import { describe, it, expect } from 'vitest'
import { wordToPhonemes } from '../src/speech/g2p'

describe('grapheme→phoneme breakdown', () => {
  it('handles soft c (city → /s/)', () => {
    const { phonemes } = wordToPhonemes('city')
    expect(phonemes[0]).toBe('s')
    expect(phonemes).toEqual(['s', 'ɪ', 't', 'iː'])
  })

  it('handles soft g (giant → /dʒ/)', () => {
    expect(wordToPhonemes('giant').phonemes[0]).toBe('dʒ')
  })

  it('keeps hard g before a back vowel (frog → /g/, focus on /r/)', () => {
    const b = wordToPhonemes('frog')
    expect(b.phonemes).toEqual(['f', 'r', 'ɑː', 'g'])
    expect(b.focusIndex).toBe(b.phonemes.indexOf('r')) // r is the coaching target
  })

  it('applies magic-e (cake → /eɪ/)', () => {
    expect(wordToPhonemes('cake').phonemes).toEqual(['k', 'eɪ', 'k'])
  })

  it('uses the exception list (cat)', () => {
    expect(wordToPhonemes('cat').phonemes).toEqual(['k', 'æ', 't'])
  })

  it('handles a digraph (ship → /ʃ/)', () => {
    expect(wordToPhonemes('ship').phonemes).toEqual(['ʃ', 'ɪ', 'p'])
  })
})

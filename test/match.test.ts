import { describe, it, expect } from 'vitest'
import { levenshtein, similarity, normalizeTranscript, matchWord } from '../src/speech/match'
import { getWord } from '../src/speech/words'

describe('levenshtein / similarity', () => {
  it('is 0 for identical strings', () => {
    expect(levenshtein('sun', 'sun')).toBe(0)
  })
  it('counts a single substitution', () => {
    expect(levenshtein('sip', 'ship')).toBe(1) // insert 'h'
  })
  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
  })
  it('similarity is 1 for identical, fractional otherwise', () => {
    expect(similarity('ship', 'ship')).toBe(1)
    expect(similarity('sip', 'ship')).toBeCloseTo(0.75, 5) // 1 - 1/4
  })
})

describe('normalizeTranscript', () => {
  it('lowercases, strips punctuation, splits words', () => {
    expect(normalizeTranscript('The Sun!')).toEqual(['the', 'sun'])
  })
})

describe('matchWord', () => {
  const sun = getWord('sun')!
  const ship = getWord('ship')!

  it('scores an exact word 100 and matched', () => {
    const r = matchWord([{ transcript: 'sun', confidence: 0.9 }], sun)
    expect(r.score).toBe(100)
    expect(r.matched).toBe(true)
    expect(r.heard).toBe('sun')
  })

  it('treats an accepted homophone as perfect', () => {
    const r = matchWord([{ transcript: 'son', confidence: 0.9 }], sun) // sun.accept = ['son']
    expect(r.score).toBe(100)
    expect(r.matched).toBe(true)
  })

  it('gives partial credit for a near miss and names what it heard', () => {
    const r = matchWord([{ transcript: 'sip', confidence: 0.9 }], ship)
    expect(r.matched).toBe(false)
    expect(r.score).toBe(75) // similarity('sip','ship') = 0.75
    expect(r.heard).toBe('sip')
    expect(r.feedback).not.toBe('')
  })

  it('scores nothing-heard as 0', () => {
    const r = matchWord([], sun)
    expect(r.score).toBe(0)
    expect(r.matched).toBe(false)
  })
})

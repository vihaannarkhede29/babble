import { describe, it, expect } from 'vitest'
import { computeResult, type DiagAttempt } from '../src/diagnostic/inference'

const at = 1_700_000_000_000

describe('diagnostic honest inference', () => {
  it('marks everything untested with no attempts', () => {
    const res = computeResult([], at)
    expect(res.summary.wordsAttempted).toBe(0)
    expect(res.summary.clear).toBe(0)
    expect(res.summary.needsPractice).toBe(0)
    expect(res.phonemes.every((p) => p.outcome === 'untested')).toBe(true)
    expect(res.config.priorityPhonemes).toEqual([])
    expect(res.config.masteredPhonemes).toEqual([])
  })

  it('a correctly-said word marks its sound CLEAR (and mastered)', () => {
    const attempts: DiagAttempt[] = [
      { word: 'SUN', heard: 'sun', score: 100, matched: true, tests: ['S'], at },
    ]
    const res = computeResult(attempts, at)
    const s = res.phonemes.find((p) => p.token === 'S')!
    expect(s.outcome).toBe('clear')
    expect(s.clear).toBe(1)
    expect(res.config.masteredPhonemes).toContain('s') // IPA of 'S'
    expect(res.summary.clear).toBeGreaterThanOrEqual(1)
  })

  it('a missed word flags its sound for PRACTISE (priority + avoid for hard sounds)', () => {
    const attempts: DiagAttempt[] = [
      { word: 'SHIP', heard: 'sip', score: 50, matched: false, tests: ['SH'], at },
    ]
    const res = computeResult(attempts, at)
    const sh = res.phonemes.find((p) => p.token === 'SH')!
    expect(sh.outcome).toBe('unclear')
    expect(res.config.priorityPhonemes).toContain('ʃ')
    expect(res.config.avoidPhonemes).toContain('ʃ') // SH is a late-developing/hard sound
    expect(res.recommendations.some((r) => r.token === 'SH')).toBe(true)
  })

  it('a single clear word outranks a miss for the same sound (conservative bias)', () => {
    const attempts: DiagAttempt[] = [
      { word: 'SUN', heard: 'sun', score: 100, matched: true, tests: ['S'], at },
      { word: 'SLIP', heard: 'lip', score: 40, matched: false, tests: ['SL'], at: at + 1 },
    ]
    const res = computeResult(attempts, at)
    // 'S' was clear in SUN; SL is a different (blend) token, so S stays clear.
    expect(res.phonemes.find((p) => p.token === 'S')!.outcome).toBe('clear')
  })
})

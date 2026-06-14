import { describe, it, expect } from 'vitest'
import {
  xpForScore,
  levelInfo,
  adaptiveSeries,
  repsToday,
  masteryByPhoneme,
} from '../src/game/store'
import type { Attempt } from '../src/lib/types'

const DAY = 86_400_000

describe('xp + levels', () => {
  it('awards xp with a bonus for strong attempts', () => {
    expect(xpForScore(50)).toBe(10) // round(50/5)
    expect(xpForScore(84)).toBe(17) // no bonus under 85
    expect(xpForScore(85)).toBe(27) // round(85/5)=17 + 10 bonus
    expect(xpForScore(100)).toBe(30)
  })
  it('computes levels on a gentle curve', () => {
    expect(levelInfo(0).level).toBe(1)
    expect(levelInfo(114).level).toBe(3)
    expect(levelInfo(0).progress).toBeGreaterThanOrEqual(0)
  })
})

describe('adaptiveSeries — axis auto-zooms to the data span', () => {
  it('is empty with no attempts', () => {
    expect(adaptiveSeries([]).points).toEqual([])
  })

  it('buckets BY HOUR within a single day', () => {
    const base = new Date(2026, 5, 13, 9, 0, 0).getTime() // 9:00 local
    const attempts: Attempt[] = [
      { phonemeId: 's', score: 80, at: base },
      { phonemeId: 's', score: 60, at: base + 3_600_000 }, // 10:00
    ]
    const s = adaptiveSeries(attempts)
    expect(s.granularity).toBe('hour')
    expect(s.points.map((p) => p.label)).toEqual(['9am', '10am'])
    expect(s.points[0].avg).toBe(80)
  })

  it('rolls up BY DAY across ~10 days', () => {
    const base = new Date(2026, 5, 1, 9, 0, 0).getTime()
    const s = adaptiveSeries([
      { phonemeId: 's', score: 70, at: base },
      { phonemeId: 's', score: 90, at: base + 10 * DAY },
    ])
    expect(s.granularity).toBe('day')
    expect(s.points).toHaveLength(2)
  })

  it('rolls up BY MONTH across several months', () => {
    const base = new Date(2026, 0, 1, 9, 0, 0).getTime()
    const s = adaptiveSeries([
      { phonemeId: 's', score: 70, at: base },
      { phonemeId: 's', score: 90, at: base + 120 * DAY },
    ])
    expect(s.granularity).toBe('month')
  })
})

describe('repsToday', () => {
  it('counts only attempts since local midnight', () => {
    const now = new Date(2026, 5, 13, 14, 0, 0).getTime()
    const attempts: Attempt[] = [
      { phonemeId: 's', score: 80, at: now }, // today
      { phonemeId: 's', score: 80, at: now - 2 * DAY }, // 2 days ago
    ]
    expect(repsToday(attempts, now)).toBe(1)
  })
})

describe('masteryByPhoneme', () => {
  it('averages score per phoneme', () => {
    const m = masteryByPhoneme([
      { phonemeId: 's', score: 80, at: 1 },
      { phonemeId: 's', score: 60, at: 2 },
    ])
    const s = m.find((x) => x.phonemeId === 's')!
    expect(s.attempts).toBe(2)
    expect(s.avg).toBe(70)
  })
})

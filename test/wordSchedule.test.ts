import { describe, it, expect } from 'vitest'
import { todaysWords, tomorrowsWords, thisWeeksWords } from '../src/speech/wordSchedule'
import type { PracticeWord } from '../src/speech/words'

const fakeCustom = (id: string): PracticeWord => ({
  id: `custom:${id}`,
  word: id,
  emoji: '🗣️',
  focusPhonemeId: 's',
  focusLabel: 'SSS',
  phonemes: ['s'],
  focusIndex: 0,
  accept: [],
  nearMiss: [],
})

describe('word scheduler', () => {
  it('is deterministic within a day', () => {
    expect(todaysWords().map((w) => w.id)).toEqual(todaysWords().map((w) => w.id))
  })

  it("today and tomorrow are different sets", () => {
    const today = todaysWords().map((w) => w.id)
    const tomorrow = tomorrowsWords().map((w) => w.id)
    expect(today).not.toEqual(tomorrow)
    expect(today).toHaveLength(5)
    expect(tomorrow).toHaveLength(5)
  })

  it('surfaces the child\'s own words first, de-duplicated', () => {
    const list = todaysWords([fakeCustom('zzz'), fakeCustom('zzz')])
    expect(list[0].id).toBe('custom:zzz')
    expect(list.filter((w) => w.id === 'custom:zzz')).toHaveLength(1)
  })

  it('this week is a deduplicated union and at least as big as a day', () => {
    const week = thisWeeksWords()
    const ids = week.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length) // no dupes
    expect(week.length).toBeGreaterThanOrEqual(todaysWords().length)
  })
})

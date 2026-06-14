import { describe, it, expect, vi, afterEach } from 'vitest'
import { normalizeWord, lookupWord } from '../src/speech/dictionary'

afterEach(() => {
  vi.restoreAllMocks()
})

function stubFetch(payload: unknown, ok = true) {
  globalThis.fetch = vi.fn(async () => ({ ok, json: async () => payload })) as unknown as typeof fetch
}

describe('normalizeWord', () => {
  it('takes the first word, lowercases, strips punctuation', () => {
    expect(normalizeWord('  The Box! ')).toBe('the')
    expect(normalizeWord('FOX')).toBe('fox')
    expect(normalizeWord('123')).toBe('')
  })
})

describe('lookupWord', () => {
  it('parses phonetic, audio, definitions, and the hidden obscure sense', async () => {
    stubFetch([
      {
        phonetic: '/fɒks/',
        phonetics: [{ text: '/fɒks/', audio: '//cdn/fox.mp3' }],
        meanings: [
          { partOfSpeech: 'noun', definitions: [{ definition: 'a wild animal' }, { definition: 'a clever person' }] },
          { partOfSpeech: 'verb', definitions: [{ definition: 'to deceive' }] },
        ],
      },
    ])
    const e = await lookupWord('fox')
    expect(e).not.toBeNull()
    expect(e!.word).toBe('fox')
    expect(e!.phonetic).toBe('/fɒks/')
    expect(e!.audio).toMatch(/^https:\/\//) // protocol-relative URL normalized
    expect(e!.definitions[0].text).toBe('a wild animal')
    // obscure = the last, least-common sense — never the everyday one
    expect(e!.obscure?.text).toBe('to deceive')
    expect(e!.obscure?.partOfSpeech).toBe('verb')
  })

  it('returns null on a miss (404) without throwing', async () => {
    stubFetch({ title: 'No Definitions Found' }, false)
    expect(await lookupWord('zzqqx')).toBeNull()
  })

  it('returns null for empty input', async () => {
    expect(await lookupWord('   ')).toBeNull()
  })
})

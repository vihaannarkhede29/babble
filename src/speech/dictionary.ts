// dictionary.ts — Optional online enrichment for a word: real phonetics, a
// kid-friendly meaning, a pronunciation clip, and a hidden "deep cut" definition.
//
// Source: the Free Dictionary API (api.dictionaryapi.dev) — no key, CORS-open.
// This is an ENHANCEMENT layered on top of the offline core: the grader and the
// g2p breakdown never depend on it. Results are cached to localStorage, so once
// a word has been looked up it works offline (and instantly) thereafter — which
// also keeps the demo snappy and resilient if the network blips.
//
// The "obscure" definition is deliberately the last, least-common sense the API
// returns (often archaic or technical). It is NOT shown by default — only if a
// curious user pries (see WordInfo). A small easter egg for word-lovers.

export interface DictDefinition {
  partOfSpeech: string
  text: string
  example?: string
}

export interface DictEntry {
  word: string
  /** IPA-ish phonetic string, e.g. "/sʌn/". */
  phonetic: string | null
  /** Pronunciation audio URL, or null. */
  audio: string | null
  /** Common-first; the first is the everyday meaning. */
  definitions: DictDefinition[]
  /** A rarely-used sense, surfaced only when the user pries. */
  obscure: DictDefinition | null
}

const CACHE_KEY = 'babble.dict.v1'
const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

// In-memory cache (this session) backed by a localStorage cache (across reloads
// + offline). We cache misses (null) too, so a missing word isn't re-fetched.
const memo = new Map<string, DictEntry | null>()

function loadDisk(): Record<string, DictEntry | null> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, DictEntry | null>
  } catch {
    // ignore
  }
  return {}
}

function saveDisk(map: Record<string, DictEntry | null>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    // storage full / private mode — session cache still works
  }
}

/** Reduce any input to a single, lookup-able lowercase word. */
export function normalizeWord(input: string): string {
  return (input.trim().split(/\s+/)[0] ?? '').toLowerCase().replace(/[^a-z'-]/g, '')
}

function parseEntry(word: string, data: unknown): DictEntry | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const first = data[0] as {
    phonetic?: string
    phonetics?: { text?: string; audio?: string }[]
    meanings?: { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] }[]
  }
  const phonetics = first.phonetics ?? []
  const phonetic = first.phonetic || phonetics.find((p) => p.text)?.text || null
  let audio = phonetics.find((p) => p.audio)?.audio || null
  if (audio && audio.startsWith('//')) audio = 'https:' + audio

  const defs: DictDefinition[] = []
  for (const m of first.meanings ?? []) {
    for (const d of m.definitions ?? []) {
      if (d.definition) {
        defs.push({ partOfSpeech: m.partOfSpeech ?? '', text: d.definition, example: d.example })
      }
    }
  }
  if (defs.length === 0) return null

  // Deep cut: the last sense, when it's distinct from the everyday one.
  const last = defs[defs.length - 1]
  const obscure = defs.length >= 3 && last.text !== defs[0].text ? last : null

  return {
    word,
    phonetic,
    audio,
    definitions: defs.slice(0, 4), // a few common senses; the obscure one is separate
    obscure,
  }
}

/** Look a word up (cache → network). Returns null when offline / not found. */
export async function lookupWord(input: string): Promise<DictEntry | null> {
  const word = normalizeWord(input)
  if (!word) return null
  if (memo.has(word)) return memo.get(word) ?? null

  const disk = loadDisk()
  if (word in disk) {
    memo.set(word, disk[word])
    return disk[word]
  }

  let entry: DictEntry | null = null
  try {
    const res = await fetch(ENDPOINT + encodeURIComponent(word))
    if (res.ok) entry = parseEntry(word, await res.json())
  } catch {
    // offline / blocked — leave entry null, but DON'T cache a transient miss to
    // disk (so it can be retried later); only cache it in-memory for this load.
    memo.set(word, null)
    return null
  }

  memo.set(word, entry)
  disk[word] = entry
  saveDisk(disk)
  return entry
}

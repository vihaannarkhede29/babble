// WordInfo.tsx — Dictionary enrichment for the current word: real phonetics, a
// kid-friendly meaning, and a tap-to-hear pronunciation. Degrades to nothing
// when offline / not found (the offline g2p breakdown still stands).
//
// HIDDEN FEATURE: a rarely-used "deep cut" definition exists but is never shown
// outright — you reveal it only by *prying* (double-click, or long-press on
// touch). The sole hint is a faint "⋯" that most people will never notice. Per
// the ask: obscure lookups shouldn't be obvious.

import { useEffect, useRef, useState } from 'react'
import { lookupWord, type DictEntry } from '../speech/dictionary'

export function WordInfo({ word }: { word: string }) {
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [pried, setPried] = useState(false)
  const pressTimer = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    setEntry(null)
    setPried(false)
    setLoading(true)
    lookupWord(word).then((e) => {
      if (alive) {
        setEntry(e)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [word])

  const playAudio = () => {
    if (!entry?.audio) return
    try {
      const a = new Audio(entry.audio)
      void a.play().catch(() => {})
    } catch {
      // ignore — audio is a bonus
    }
  }

  const pry = () => {
    if (entry?.obscure) setPried(true)
  }
  const startPress = () => {
    if (!entry?.obscure) return
    pressTimer.current = window.setTimeout(pry, 550)
  }
  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  if (loading) return <div className="wordinfo wordinfo--loading">📖 looking it up…</div>
  if (!entry || entry.definitions.length === 0) return null

  const def = entry.definitions[0]
  return (
    <div
      className="wordinfo card-tactile"
      onDoubleClick={pry}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      title="" // intentionally no tooltip hinting at the hidden definition
    >
      <div className="wordinfo-head">
        <span className="wordinfo-icon">📖</span>
        {entry.phonetic && <span className="wordinfo-ipa">{entry.phonetic}</span>}
        {entry.audio && (
          <button className="wordinfo-audio" onClick={playAudio} aria-label="Hear the word">
            🔊
          </button>
        )}
        {def.partOfSpeech && <span className="wordinfo-pos">{def.partOfSpeech}</span>}
        {entry.obscure && !pried && <span className="wordinfo-pry" aria-hidden="true">⋯</span>}
      </div>
      <div className="wordinfo-def">{def.text}</div>
      {def.example && <div className="wordinfo-ex">“{def.example}”</div>}
      {pried && entry.obscure && (
        <div className="wordinfo-obscure">
          <span className="wordinfo-obscure-tag">deep cut · {entry.obscure.partOfSpeech}</span>
          {entry.obscure.text}
        </div>
      )}
    </div>
  )
}

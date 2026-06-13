// ParentGate.tsx — A lightweight "grown-ups only" gate in front of the parent
// areas (Progress, Settings, the diagnostic report). If a PIN has been set it's
// required; if not, it shows a simple speed-bump and a nudge to set one. This is
// child-deterrence, not real security — all data is local to the device.

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../profile/store'

interface Props {
  children: ReactNode
  title?: string
}

export function ParentGate({ children, title = 'Grown-up zone' }: Props) {
  const { profile } = useProfile()
  const [unlocked, setUnlocked] = useState(false)
  const [entry, setEntry] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  const hasPin = !!profile.parentPin

  const press = (d: string) => {
    setError(false)
    const next = (entry + d).slice(0, 4)
    setEntry(next)
    if (next.length === 4) {
      if (next === profile.parentPin) {
        setUnlocked(true)
      } else {
        setError(true)
        setTimeout(() => setEntry(''), 400)
      }
    }
  }

  return (
    <div className="gate">
      <div className="gate-card card-tactile">
        <div className="gate-emoji">🔒</div>
        <h2 className="gate-title">{title}</h2>

        {hasPin ? (
          <>
            <p className="gate-sub">Ask a grown-up to enter the PIN.</p>
            <div className={`pin-dots${error ? ' pin-dots--error' : ''}`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`pin-dot${i < entry.length ? ' pin-dot--filled' : ''}`} />
              ))}
            </div>
            {error && <div className="gate-error">Wrong PIN — try again</div>}
            <div className="pin-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} className="pin-key btn-pressable" onClick={() => press(d)}>
                  {d}
                </button>
              ))}
              <button className="pin-key pin-key--ghost" onClick={() => setEntry('')}>
                ✕
              </button>
              <button className="pin-key btn-pressable" onClick={() => press('0')}>
                0
              </button>
              <button
                className="pin-key pin-key--ghost"
                onClick={() => setEntry((e) => e.slice(0, -1))}
              >
                ⌫
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="gate-sub">
              This area has progress data and settings. You can set a PIN in Settings to keep it
              grown-ups-only.
            </p>
            <button className="btn-teal btn-pressable gate-continue" onClick={() => setUnlocked(true)}>
              I'm a grown-up — continue
            </button>
            <Link to="/settings" className="gate-link">
              Set a parent PIN →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

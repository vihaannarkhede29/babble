// DiagnosticReport.tsx — The grown-up output of the "Teach Blaze" screener.
//
// A phoneme grid (clear / needs-practice / untested), the top sounds to work on
// with a concrete mouth cue, and export (print-to-PDF, CSV, email). Honest by
// construction: this is a word-level early screener, not a clinical assessment —
// the page says so, and nothing here is a fabricated per-phoneme percentage.

import { Link, useNavigate } from 'react-router-dom'
import { ParentGate } from '../components/ParentGate'
import { useProfile, profileStore } from '../profile/store'
import { useDiagnosticResult, diagnosticStore } from '../diagnostic/store'
import type { DiagnosticResult, PhonemeOutcome } from '../diagnostic/inference'

const OUTCOME_LABEL: Record<PhonemeOutcome, string> = {
  clear: 'Clear',
  unclear: 'Practise',
  untested: 'Not tested',
}

function ReportInner({ result }: { result: DiagnosticResult }) {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const name = profile.childName.trim() || 'Your child'
  const date = new Date(result.completedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const exportCsv = () => {
    const header = 'sound,ipa,outcome,words_attempted,words_clear\n'
    const rows = result.phonemes
      .map((p) => `${p.label},${p.ipa},${p.outcome},${p.attempted},${p.clear}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'blaze-first-words-screen.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const emailReport = () => {
    const lines = [
      `${name}'s first-words screen — ${date}`,
      '',
      `Words attempted: ${result.summary.wordsAttempted}/${result.summary.totalWords}`,
      `Sounds clear: ${result.summary.clear} · to practise: ${result.summary.needsPractice}`,
      '',
      'Sounds to work on:',
      ...result.recommendations.map((r) => `• ${r.label} (as in “${r.example}”): ${r.cue}`),
      '',
      'Note: this is a playful at-home screener based on whole-word recognition, not a clinical assessment.',
    ]
    const url = `mailto:?subject=${encodeURIComponent(`${name}'s speech-sounds screen`)}&body=${encodeURIComponent(
      lines.join('\n'),
    )}`
    window.location.href = url
  }

  return (
    <div className="report">
      <div className="report-head">
        <div>
          <h1 className="report-title">First-words screen</h1>
          <p className="report-meta">
            {name} · {date}
          </p>
        </div>
        <Link to="/" className="report-home">
          ✕
        </Link>
      </div>

      {/* summary */}
      <section className="report-summary">
        <div className="rs-stat">
          <span className="rs-num">{result.summary.wordsAttempted}</span>
          <span className="rs-label">words tried</span>
        </div>
        <div className="rs-stat rs-stat--clear">
          <span className="rs-num">{result.summary.clear}</span>
          <span className="rs-label">sounds clear</span>
        </div>
        <div className="rs-stat rs-stat--practice">
          <span className="rs-num">{result.summary.needsPractice}</span>
          <span className="rs-label">to practise</span>
        </div>
      </section>

      {/* recommendations */}
      {result.recommendations.length > 0 && (
        <section className="panel">
          <h3>Work on these first</h3>
          <div className="rec-list">
            {result.recommendations.map((r) => (
              <div className="rec" key={r.token}>
                <div className="rec-badge">{r.label}</div>
                <div className="rec-body">
                  <div className="rec-cue">{r.cue}</div>
                  <div className="rec-example">
                    Try the word “{r.example}”. Tap into the Coach to practise it.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* phoneme grid */}
      <section className="panel">
        <h3>Every sound we screened</h3>
        <div className="diag-grid">
          {result.phonemes.map((p) => (
            <div key={p.token} className={`diag-cell diag-cell--${p.outcome}`} title={`/${p.ipa}/`}>
              <span className="diag-cell-label">{p.label}</span>
              <span className="diag-cell-state">{OUTCOME_LABEL[p.outcome]}</span>
            </div>
          ))}
        </div>
        <div className="diag-legend">
          <span><i className="lg lg--clear" /> Clear</span>
          <span><i className="lg lg--unclear" /> Practise</span>
          <span><i className="lg lg--untested" /> Not tested</span>
        </div>
      </section>

      <p className="report-disclaimer">
        How to read this: {name} said each picture word once, and we inferred each sound from whether
        the whole word was recognised correctly. It's a playful early screener to spot sounds worth
        attention — <strong>not a clinical diagnosis</strong>. Browser speech recognition is tuned for
        adults, so treat “practise” flags as gentle hints. If you have concerns, share the CSV with a
        school speech-language pathologist.
      </p>

      <div className="report-actions">
        <button className="btn-teal btn-pressable" onClick={() => window.print()}>
          🖨 Print / Save PDF
        </button>
        <button className="btn-teal btn-pressable" onClick={exportCsv}>
          ⬇ Export CSV
        </button>
        <button className="btn-teal btn-pressable" onClick={emailReport}>
          ✉ Email
        </button>
        <button
          className="btn-coral btn-pressable"
          onClick={() => {
            diagnosticStore.reset()
            profileStore.update({ diagnosticComplete: false })
            navigate('/teach-blaze')
          }}
        >
          Redo screen
        </button>
      </div>
    </div>
  )
}

export function DiagnosticReport() {
  const result = useDiagnosticResult()
  return (
    <ParentGate title="First-words report">
      {result ? (
        <ReportInner result={result} />
      ) : (
        <div className="report-empty">
          <h1>No screen yet</h1>
          <p>Run the “Teach Blaze his first words” adventure to generate a report.</p>
          <Link to="/teach-blaze" className="btn-coral btn-pressable">
            Start it →
          </Link>
        </div>
      )}
    </ParentGate>
  )
}

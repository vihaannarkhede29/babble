// Dashboard.tsx — The parent/teacher view. Visualises phoneme mastery over time
// with Recharts, and surfaces the headline outcome the brief calls for:
// measurable accuracy *before vs after* a session.

import { useMemo, useSyncExternalStore } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getPhoneme } from '../audio/phonemes'
import { dailySeries, gameStore, levelInfo, masteryByPhoneme, sessionDelta } from '../game/store'
import { SESSION_START } from '../lib/session'
import { scoreColorPct } from '../lib/colors'

export function Dashboard() {
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)

  const mastery = useMemo(() => masteryByPhoneme(save.attempts), [save.attempts])
  const series = useMemo(() => dailySeries(save.attempts), [save.attempts])
  const deltas = useMemo(() => sessionDelta(save.attempts, SESSION_START), [save.attempts])

  const lvl = levelInfo(save.xp)
  const totalReps = save.attempts.length
  const days = new Set(save.attempts.map((a) => new Date(a.at).toISOString().slice(0, 10))).size
  const avgMastery = Math.round(
    mastery.filter((m) => m.attempts > 0).reduce((s, m) => s + m.avg, 0) /
      Math.max(1, mastery.filter((m) => m.attempts > 0).length),
  )
  const avgGain =
    deltas.length > 0
      ? Math.round(deltas.reduce((s, d) => s + d.delta, 0) / deltas.length)
      : null

  const masteryData = mastery
    .filter((m) => m.attempts > 0)
    .map((m) => ({ name: getPhoneme(m.phonemeId)?.label ?? m.phonemeId, mastery: m.avg }))

  // Deterministic "what to work on next": the lowest-mastery practised sounds.
  const focus = mastery
    .filter((m) => m.attempts > 0)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)

  // One-click export of the full practice log — the hand-to-an-SLP artifact.
  // No audio is ever exported, only the derived accuracy numbers.
  const exportCsv = () => {
    const header = 'timestamp,sound,ipa,score_percent\n'
    const rows = [...save.attempts]
      .sort((a, b) => a.at - b.at)
      .map((a) => {
        const p = getPhoneme(a.phonemeId)
        return `${new Date(a.at).toISOString()},${p?.label ?? a.phonemeId},${p?.ipa ?? ''},${a.score}`
      })
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'phonicsforge-progress.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dashboard">
      <h2 className="dash-title">Progress for Sparky's friend</h2>

      {/* headline outcome */}
      <section className="outcome-card">
        {avgGain !== null ? (
          <>
            <div className="outcome-big" style={{ color: scoreColorPct(50 + avgGain * 2) }}>
              {avgGain >= 0 ? '+' : ''}
              {avgGain}%
            </div>
            <div className="outcome-sub">
              average accuracy gain this session across {deltas.length} sound
              {deltas.length === 1 ? '' : 's'}
            </div>
          </>
        ) : (
          <div className="outcome-sub">
            Practise a few sounds in the <strong>Coach</strong> tab to see this session's
            before→after gains.
          </div>
        )}
      </section>

      {/* stat strip */}
      <section className="stat-strip">
        <Stat label="Level" value={`${lvl.level}`} />
        <Stat label="Total reps" value={`${totalReps}`} />
        <Stat label="Days practised" value={`${days}`} />
        <Stat label="Avg mastery" value={`${avgMastery}%`} />
      </section>

      {/* before/after this session */}
      {deltas.length > 0 && (
        <section className="panel">
          <h3>This session: before → after</h3>
          <div className="ba-list">
            {deltas.map((d) => {
              const p = getPhoneme(d.phonemeId)
              return (
                <div className="ba-row" key={d.phonemeId}>
                  <span className="ba-sound">
                    {p?.emoji} {p?.label}
                  </span>
                  <span className="ba-before">{d.before}%</span>
                  <span className="ba-arrow">→</span>
                  <span className="ba-after" style={{ color: scoreColorPct(d.after) }}>
                    {d.after}%
                  </span>
                  <span className={`ba-delta${d.delta >= 0 ? ' up' : ' down'}`}>
                    {d.delta >= 0 ? '▲' : '▼'} {Math.abs(d.delta)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* deterministic "focus next" — surfaces the sounds that need work */}
      {focus.length > 0 && (
        <section className="panel">
          <h3>Sounds to focus on next</h3>
          <div className="focus-list">
            {focus.map((m) => {
              const p = getPhoneme(m.phonemeId)
              return (
                <div className="focus-chip" key={m.phonemeId}>
                  <span className="focus-dot" style={{ background: scoreColorPct(m.avg) }} />
                  {p?.emoji} <strong>{p?.label}</strong> — {m.avg}%
                </div>
              )
            })}
          </div>
          <p className="panel-note">
            Lowest-mastery sounds, flagged automatically from practice history.
          </p>
        </section>
      )}

      {/* mastery over time */}
      <section className="panel">
        <h3>Mastery over time</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2342" />
              <XAxis dataKey="date" stroke="#9a8fc0" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#9a8fc0" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1c1633', border: '1px solid #3a2f5c', borderRadius: 8 }}
                labelStyle={{ color: '#cdb4ff' }}
              />
              <Line type="monotone" dataKey="avg" name="Daily avg %" stroke="#a855f7"
                strokeWidth={3} dot={{ r: 3, fill: '#a855f7' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* mastery by sound */}
      <section className="panel">
        <h3>Mastery by sound</h3>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={masteryData} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2342" />
              <XAxis dataKey="name" stroke="#9a8fc0" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#9a8fc0" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1c1633', border: '1px solid #3a2f5c', borderRadius: 8 }}
                cursor={{ fill: 'rgba(168,85,247,0.08)' }}
              />
              <Bar dataKey="mastery" name="Mastery %" radius={[6, 6, 0, 0]}>
                {masteryData.map((d) => (
                  <Cell key={d.name} fill={scoreColorPct(d.mastery)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="panel-note">
          Lower bars flag sounds to revisit — here the /s/ and /ʃ/ sibilants lag the vowels,
          the classic early-articulation target.
        </p>
      </section>

      {/* SLP handoff: a clean clinical summary a parent can show a therapist */}
      <section className="panel slp-card">
        <h3>Ready-for-therapy summary</h3>
        <table className="slp-table">
          <thead>
            <tr>
              <th>Sound</th>
              <th>Reps</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {[...mastery]
              .filter((m) => m.attempts > 0)
              .sort((a, b) => a.avg - b.avg)
              .map((m) => {
                const p = getPhoneme(m.phonemeId)
                return (
                  <tr key={m.phonemeId}>
                    <td>
                      {p?.emoji} <strong>{p?.label}</strong> <span className="slp-ipa">/{p?.ipa}/</span>
                    </td>
                    <td>{m.attempts}</td>
                    <td>
                      <span className="slp-acc" style={{ color: scoreColorPct(m.avg) }}>
                        {m.avg}%
                      </span>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        <p className="panel-note">
          Hand-off baseline — show this (or the CSV) to a school SLP at the first appointment.
        </p>
      </section>

      <div className="dash-actions">
        <button className="export-btn" onClick={exportCsv}>
          ⬇ Export progress (CSV)
        </button>
        <button className="reset-btn" onClick={() => gameStore.reset()}>
          Reset demo data
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

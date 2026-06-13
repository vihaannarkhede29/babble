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

      <button className="reset-btn" onClick={() => gameStore.reset()}>
        Reset demo data
      </button>
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

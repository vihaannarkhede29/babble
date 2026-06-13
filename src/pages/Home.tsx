// Home.tsx — The hub. Greets the child + Blaze, shows today's goal as a live
// progress ring (completes when the daily word count is hit), offers the three
// doors, and lists Today / Tomorrow / This-week words from the scheduler — with
// the child's own added words surfaced first and diagnostic-priority sounds
// flagged.

import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../profile/store'
import { gameStore, levelInfo, repsToday } from '../game/store'
import { Blaze } from '../components/Blaze'
import { type PracticeWord } from '../speech/words'
import { todaysWords, tomorrowsWords, thisWeeksWords } from '../speech/wordSchedule'
import { buildCustomWord, loadCustomInputs } from '../speech/customWords'
import { toIpaToken } from '../speech/phonemeTokens'

type Tab = 'today' | 'tomorrow' | 'week'

function GoalRing({ reps, goal }: { reps: number; goal: number }) {
  const pct = Math.min(1, goal > 0 ? reps / goal : 1)
  const R = 34
  const C = 2 * Math.PI * R
  const done = reps >= goal
  return (
    <svg viewBox="0 0 80 80" className="goal-ring" aria-label={`${reps} of ${goal} words today`}>
      <circle cx="40" cy="40" r={R} className="goal-ring-track" />
      <circle
        cx="40"
        cy="40"
        r={R}
        className="goal-ring-fill"
        stroke={done ? '#3BBFBF' : '#FFD166'}
        strokeDasharray={`${C * pct} ${C}`}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="38" className="goal-ring-num">
        {Math.min(reps, goal)}/{goal}
      </text>
      <text x="40" y="52" className="goal-ring-cap">
        {done ? 'done!' : 'words'}
      </text>
    </svg>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { profile, dailyGoal, needsDiagnostic } = useProfile()
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const name = profile.childName.trim() || 'friend'
  const dragon = profile.dragonName.trim() || 'Blaze'

  const reps = repsToday(save.attempts)
  const goalDone = reps >= dailyGoal
  const lvl = levelInfo(save.xp)

  const custom = useMemo(
    () => loadCustomInputs().map(buildCustomWord).filter((x): x is PracticeWord => !!x),
    [],
  )
  const lists: Record<Tab, PracticeWord[]> = useMemo(
    () => ({ today: todaysWords(custom), tomorrow: tomorrowsWords(), week: thisWeeksWords() }),
    [custom],
  )
  const [tab, setTab] = useState<Tab>('today')

  const isPriority = (w: PracticeWord) =>
    w.phonemes.map(toIpaToken).some((p) => profile.priorityPhonemes.includes(p))

  return (
    <div className="home">
      <section className="home-hero card-tactile">
        <Blaze state={goalDone ? 'celebrating' : 'idle'} size="lg" glow={goalDone ? 0.6 : 0} />
        <div className="home-hero-text">
          <h1 className="home-greeting">Hi {name}! 👋</h1>
          {goalDone ? (
            <p className="home-tagline">
              🎉 <strong>Daily goal complete!</strong> {reps} words today. Keep going for bonus XP, or
              come back tomorrow.
            </p>
          ) : (
            <p className="home-tagline">
              {dragon} is ready. Goal: <strong>{dailyGoal} words</strong> today — you've done{' '}
              <strong>{reps}</strong>. Level {lvl.level}.
            </p>
          )}
        </div>
        <GoalRing reps={reps} goal={dailyGoal} />
      </section>

      {needsDiagnostic && (
        <Link to="/teach-blaze" className="home-banner btn-pressable">
          <span className="home-banner-emoji">🥚</span>
          <span>
            <strong>Teach {dragon} his first words</strong>
            <br />A quick, playful warm-up that finds {name}'s sounds.
          </span>
          <span className="home-banner-go">→</span>
        </Link>
      )}

      <div className="home-doors">
        <button className="door door--teal btn-pressable" onClick={() => navigate('/practice')}>
          <span className="door-emoji">🎤</span>
          <span className="door-title">Practise words</span>
          <span className="door-sub">Say it, see the wave, win stars</span>
        </button>

        <button className="door door--coral btn-pressable" onClick={() => navigate('/teach-blaze')}>
          <span className="door-emoji">🐲</span>
          <span className="door-title">Teach {dragon}</span>
          <span className="door-sub">The first-words adventure</span>
        </button>

        <Link to="/dashboard" className="door door--cream btn-pressable">
          <span className="door-emoji">📊</span>
          <span className="door-title">Grown-up progress</span>
          <span className="door-sub">Charts, sounds & therapy summary</span>
        </Link>
      </div>

      <section className="home-rail">
        <div className="rail-tabs">
          {(['today', 'tomorrow', 'week'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`rail-tab${tab === t ? ' rail-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'today' ? 'Today' : t === 'tomorrow' ? 'Tomorrow' : 'This week'}
            </button>
          ))}
        </div>
        <div className="home-rail-track">
          {lists[tab].map((wd) => {
            const priority = isPriority(wd)
            const isCustom = wd.id.startsWith('custom:')
            return (
              <button
                key={wd.id}
                className={`rail-word tile-wood btn-pressable${priority ? ' rail-word--priority' : ''}`}
                onClick={() => navigate(`/practice/${wd.id}`)}
              >
                <span className="rail-word-emoji">{wd.emoji}</span>
                <span className="rail-word-label">{wd.word}</span>
                <span className="rail-word-sound">{wd.focusLabel}</span>
                {priority && <span className="rail-word-flag">focus</span>}
                {isCustom && !priority && <span className="rail-word-flag rail-word-flag--custom">yours</span>}
              </button>
            )
          })}
        </div>
        <p className="panel-note rail-note">
          {tab === 'today'
            ? "Today's mix — your own words come first. Tap one to practise."
            : tab === 'tomorrow'
              ? "Tomorrow's words — a fresh set each day."
              : 'Everything coming up this week.'}
        </p>
      </section>
    </div>
  )
}

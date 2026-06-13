// AppHeader.tsx — Branded header with the live XP/level bar and primary nav.
// Shown on the "everyday" screens (home / practice / progress / settings); the
// immersive flows (onboarding, teach-Blaze, diagnostic) render without it.

import { useSyncExternalStore } from 'react'
import { NavLink } from 'react-router-dom'
import { gameStore, levelInfo } from '../game/store'

const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'tab tab--active' : 'tab')

export function AppHeader() {
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const lvl = levelInfo(save.xp)

  return (
    <header className="app-header">
      <NavLink to="/" className="brand">
        <span className="brand-mark">🐲</span>
        <div>
          <h1>PhonicsForge</h1>
          <p>Real-time speech coaching for pre-readers</p>
        </div>
      </NavLink>

      <div className="level-box" title={`${save.xp} XP`}>
        <div className="level-badge">Lvl {lvl.level}</div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
        </div>
      </div>

      <nav className="tabs">
        <NavLink to="/" end className={link}>
          🏠 Home
        </NavLink>
        <NavLink to="/practice" className={link}>
          🎤 Coach
        </NavLink>
        <NavLink to="/dashboard" className={link}>
          📊 Progress
        </NavLink>
        <NavLink to="/settings" className={link} aria-label="Settings">
          ⚙️
        </NavLink>
      </nav>
    </header>
  )
}

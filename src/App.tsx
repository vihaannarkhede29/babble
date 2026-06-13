// App.tsx — Shell: branded header with the live XP/level bar, and a two-tab
// switch between the child's Coach view and the parent/teacher Dashboard.

import { useState, useSyncExternalStore } from 'react'
import { gameStore, levelInfo } from './game/store'
import { WordPractice } from './components/WordPractice'
import { Dashboard } from './components/Dashboard'

type Tab = 'coach' | 'progress'

export default function App() {
  const [tab, setTab] = useState<Tab>('coach')
  const save = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const lvl = levelInfo(save.xp)

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">🐲</span>
          <div>
            <h1>PhonicsForge</h1>
            <p>Real-time speech coaching for pre-readers</p>
          </div>
        </div>

        <div className="level-box" title={`${save.xp} XP`}>
          <div className="level-badge">Lvl {lvl.level}</div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
          </div>
        </div>

        <nav className="tabs">
          <button className={tab === 'coach' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('coach')}>
            🎤 Coach
          </button>
          <button className={tab === 'progress' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('progress')}>
            📊 Progress
          </button>
        </nav>
      </header>

      <main className="app-main">{tab === 'coach' ? <WordPractice /> : <Dashboard />}</main>
    </div>
  )
}

// App.tsx — The multi-page shell.
//
// BrowserRouter + a gate that funnels first-run users through onboarding. The
// "everyday" screens (home / practice / progress / settings) wear the branded
// header; the immersive story flows (onboarding, teach-Blaze, diagnostic) take
// over the full screen. Practice (our real speech engine) and the Progress
// dashboard are unchanged — they're now routes instead of tabs.

import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { useProfile } from './profile/store'
import { Home } from './pages/Home'
import { Onboarding } from './pages/Onboarding'
import { PracticeRoute } from './pages/PracticeRoute'
import { ProgressRoute } from './pages/ProgressRoute'
import { Settings } from './pages/Settings'
import { TeachBlazeIntro } from './pages/TeachBlazeIntro'
import { Diagnostic } from './pages/Diagnostic'
import { DiagnosticReport } from './pages/DiagnosticReport'

const IMMERSIVE = new Set(['/onboarding', '/teach-blaze', '/diagnostic'])

function Shell() {
  const location = useLocation()
  const { isOnboarded } = useProfile()

  // First-run gate: everything funnels through onboarding until a profile exists.
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  const immersive = IMMERSIVE.has(location.pathname)

  return (
    <div className="app">
      {!immersive && <AppHeader />}
      <main className={immersive ? 'app-main app-main--immersive' : 'app-main'}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<PracticeRoute />} />
          <Route path="/practice/:wordId" element={<PracticeRoute />} />
          <Route path="/teach-blaze" element={<TeachBlazeIntro />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/diagnostic/report" element={<DiagnosticReport />} />
          <Route path="/dashboard" element={<ProgressRoute />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

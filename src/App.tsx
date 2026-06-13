import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireOnboarding } from './components/layout/RequireOnboarding'
import { CelebrationPage } from './pages/CelebrationPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PracticePage } from './pages/PracticePage'
import { SettingsPage } from './pages/SettingsPage'
import { TeachBlazeIntroPage } from './pages/TeachBlazeIntroPage'

function App() {
  return (
    <BrowserRouter>
      <RequireOnboarding>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/teach-blaze" element={<TeachBlazeIntroPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/practice/:word" element={<PracticePage />} />
          <Route path="/celebration" element={<CelebrationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </RequireOnboarding>
    </BrowserRouter>
  )
}

export default App

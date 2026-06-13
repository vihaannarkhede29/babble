// ProgressRoute.tsx — The grown-up dashboard, behind the parent gate.

import { ParentGate } from '../components/ParentGate'
import { Dashboard } from '../components/Dashboard'

export function ProgressRoute() {
  return (
    <ParentGate title="Progress dashboard">
      <Dashboard />
    </ParentGate>
  )
}

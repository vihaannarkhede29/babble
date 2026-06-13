import { Navigate, useLocation } from 'react-router-dom'
import { useChildProfile } from '../../hooks/useChildProfile'

const PUBLIC_PATHS = ['/onboarding']

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { isOnboarded, needsDiagnostic } = useChildProfile()
  const path = useLocation().pathname

  if (!isOnboarded && !PUBLIC_PATHS.includes(path)) {
    return <Navigate to="/onboarding" replace />
  }

  if (isOnboarded && path === '/onboarding') {
    return <Navigate to={needsDiagnostic ? '/teach-blaze' : '/'} replace />
  }

  if (needsDiagnostic && path !== '/teach-blaze') {
    return <Navigate to="/teach-blaze" replace />
  }

  if (!needsDiagnostic && path === '/teach-blaze') {
    return <Navigate to="/" replace />
  }

  return children
}

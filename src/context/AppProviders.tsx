import { ChildProfileProvider } from '../hooks/useChildProfile'
import { LocalProgressProvider } from '../hooks/useLocalProgress'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ChildProfileProvider>
      <LocalProgressProvider>{children}</LocalProgressProvider>
    </ChildProfileProvider>
  )
}

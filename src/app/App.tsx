import { AppProviders } from './providers/AppProviders'
import { AppRoutes } from './router'

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}

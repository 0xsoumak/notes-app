import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { WorkspaceProvider } from '@/features/workspace'
import { ThemeProvider } from './ThemeProvider'

interface AppProvidersProps {
  children: ReactNode
}

/** One place to compose app-wide context. Add new providers here. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

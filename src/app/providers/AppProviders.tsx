import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { CommandMenuProvider } from '@/features/command-menu'
import { SettingsDialogProvider } from '@/features/settings'
import { SyncProvider, WorkspaceProvider } from '@/features/workspace'
import { ThemeProvider } from './ThemeProvider'

interface AppProvidersProps {
  children: ReactNode
}

/** One place to compose app-wide context. Add new providers here. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <WorkspaceProvider>
          <SyncProvider>
            <SettingsDialogProvider>
              {/* Innermost: its actions read from every provider above it. */}
              <CommandMenuProvider>{children}</CommandMenuProvider>
            </SettingsDialogProvider>
          </SyncProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

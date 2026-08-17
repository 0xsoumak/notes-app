import { createContext, use } from 'react'
import type { GitHubConfig } from '../github/github-config'
import type { SyncReport } from './sync-engine'

export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface SyncContextValue {
  config: GitHubConfig | null
  isConfigured: boolean
  status: SyncStatus
  error: string | null
  lastSyncedAt: number | null
  lastReport: SyncReport | null
  /** Saves credentials, verifies them against GitHub, then syncs. */
  connect: (config: GitHubConfig) => Promise<void>
  disconnect: () => Promise<void>
  /**
   * Pulls remote changes, then pushes local ones. One control for both
   * directions: the conflict policy is local-wins and a pull never touches a
   * file with unpushed edits, so which way it goes is never a decision the user
   * has to make.
   */
  sync: () => Promise<void>
}

export const SyncContext = createContext<SyncContextValue | null>(null)

export function useSync(): SyncContextValue {
  const context = use(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a <SyncProvider>')
  }
  return context
}

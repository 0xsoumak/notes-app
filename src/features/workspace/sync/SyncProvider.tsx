import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { clearLocalData, readMeta, writeMeta } from '../data/db'
import { createGitHubClient } from '../github/github-client'
import { describeGitHubError } from '../github/github-errors'
import {
  clearConfig,
  configFingerprint,
  readConfig,
  writeConfig,
  type GitHubConfig,
} from '../github/github-config'
import { SyncContext, type SyncContextValue, type SyncStatus } from './sync-context'
import { runSync, type SyncReport } from './sync-engine'

const LAST_SYNCED_KEY = 'lastSyncedAt'
const REPO_FINGERPRINT_KEY = 'repoFingerprint'

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [config, setConfig] = useState<GitHubConfig | null>(readConfig)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [lastReport, setLastReport] = useState<SyncReport | null>(null)

  // Guards against a second sync starting while one is in flight.
  const inFlightRef = useRef(false)

  useEffect(() => {
    void readMeta<number>(LAST_SYNCED_KEY).then((value) => setLastSyncedAt(value ?? null))
  }, [])

  const sync = useCallback(async () => {
    if (!config || inFlightRef.current) return

    inFlightRef.current = true
    setStatus('syncing')
    setError(null)

    try {
      const report = await runSync(config)
      const syncedAt = Date.now()

      await writeMeta(LAST_SYNCED_KEY, syncedAt)
      setLastSyncedAt(syncedAt)
      setLastReport(report)
      setStatus('idle')
    } catch (caught) {
      setError(describeGitHubError(caught))
      setStatus('error')
    } finally {
      inFlightRef.current = false
    }
  }, [config])

  const connect = useCallback(async (next: GitHubConfig) => {
    setStatus('syncing')
    setError(null)

    try {
      // Fail fast on bad credentials rather than part-way through a sync.
      await createGitHubClient(next).verifyAccess()

      // Pointing at a different repo makes the local cache meaningless.
      const fingerprint = configFingerprint(next)
      const previous = await readMeta<string>(REPO_FINGERPRINT_KEY)
      if (previous && previous !== fingerprint) {
        await clearLocalData()
        setLastSyncedAt(null)
      }
      await writeMeta(REPO_FINGERPRINT_KEY, fingerprint)

      writeConfig(next)
      setConfig(next)
      setStatus('idle')
    } catch (caught) {
      setError(describeGitHubError(caught))
      setStatus('error')
      throw caught
    }
  }, [])

  const disconnect = useCallback(async () => {
    clearConfig()
    await clearLocalData()
    setConfig(null)
    setLastSyncedAt(null)
    setLastReport(null)
    setStatus('idle')
    setError(null)
  }, [])

  const value = useMemo<SyncContextValue>(
    () => ({
      config,
      isConfigured: config !== null,
      status,
      error,
      lastSyncedAt,
      lastReport,
      connect,
      disconnect,
      sync,
    }),
    [config, status, error, lastSyncedAt, lastReport, connect, disconnect, sync],
  )

  return <SyncContext value={value}>{children}</SyncContext>
}

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
import { runPull, runSync, type SyncReport } from './sync-engine'

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

  // Guards against a second run starting while one is in flight.
  const inFlightRef = useRef(false)

  useEffect(() => {
    void readMeta<number>(LAST_SYNCED_KEY).then((value) => setLastSyncedAt(value ?? null))
  }, [])

  /**
   * Shared body of both sync paths: one run at a time, and the clock advanced
   * only once the remote has actually answered.
   *
   * `quiet` is for the launch pull, which nobody asked for and so reports
   * nothing when it fails.
   */
  const run = useCallback(
    async (operation: (config: GitHubConfig) => Promise<SyncReport>, quiet = false) => {
      if (!config || inFlightRef.current) return

      inFlightRef.current = true
      setStatus('syncing')
      setError(null)

      try {
        const report = await operation(config)
        const syncedAt = Date.now()

        await writeMeta(LAST_SYNCED_KEY, syncedAt)
        setLastSyncedAt(syncedAt)
        setLastReport(report)
        setStatus('idle')
      } catch (caught) {
        if (quiet) {
          setStatus('idle')
        } else {
          setError(describeGitHubError(caught))
          setStatus('error')
        }
      } finally {
        inFlightRef.current = false
      }
    },
    [config],
  )

  const sync = useCallback(() => run(runSync), [run])

  /**
   * Pulls once when the app opens, so a notebook edited on another device is
   * current before it is read — the thing a manual-only sync cannot give you,
   * since by the time you notice the notes are stale you have already read them.
   *
   * Pull, not sync: taking a fresh copy of a repository is not an action that
   * needs asking about, but writing a commit to one is. Pending local work
   * stays pending until the user presses Sync.
   *
   * Failures are swallowed. Opening an installed app offline is ordinary, and a
   * bad token is worth reporting when the user asks to sync — not as the first
   * thing they see on launch. Every note is on disk either way.
   */
  const launchedRef = useRef(false)

  useEffect(() => {
    // Only the config present at mount matters: connecting later in the session
    // runs its own first sync, and this must not fire a second time.
    if (launchedRef.current) return
    launchedRef.current = true
    if (!config) return

    void run(runPull, true)
  }, [config, run])

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

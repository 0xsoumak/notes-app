import { SyncIcon, SpinnerIcon, WarningIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-date'
import { useWorkspace } from '../../hooks/use-workspace'
import { useSync } from '../../sync/sync-context'

interface SyncButtonProps {
  /**
   * Settings now lives in a dialog rather than a route, and this component
   * sits in the workspace feature, which the settings feature already
   * depends on — so the caller supplies how to get there instead of this
   * reaching back across the boundary.
   */
  onConnect: () => void
}

/** Sync trigger plus the state of the last run, shown at the foot of the sidebar. */
export function SyncButton({ onConnect }: SyncButtonProps) {
  const { isConfigured, status, error, lastSyncedAt, sync } = useSync()
  const { pendingCount } = useWorkspace()

  if (!isConfigured) {
    return (
      <button
        type="button"
        onClick={onConnect}
        className="text-content-muted hover:bg-surface-hover hover:text-content flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition"
      >
        <SyncIcon className="size-4" />
        Connect GitHub
      </button>
    )
  }

  const isSyncing = status === 'syncing'

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void sync()}
        disabled={isSyncing}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition',
          'text-content-muted hover:bg-surface-hover hover:text-content',
          'disabled:cursor-default disabled:opacity-70',
        )}
      >
        {isSyncing ? (
          <SpinnerIcon className="size-4 animate-spin" />
        ) : status === 'error' ? (
          <WarningIcon className="size-4 text-amber-500" />
        ) : (
          <SyncIcon className="size-4" />
        )}

        <span className="flex-1 text-left">
          {isSyncing ? 'Syncing…' : `Synced ${formatRelativeTime(lastSyncedAt ?? 0)}`}
        </span>

        {pendingCount > 0 && !isSyncing && (
          <span className="bg-content-muted/20 text-content rounded-full px-1.5 py-0.5 text-[10px]">
            {pendingCount}
          </span>
        )}
      </button>

      {error && <p className="px-2 text-[11px] text-amber-600 dark:text-amber-400">{error}</p>}
    </div>
  )
}

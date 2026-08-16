import { Link } from 'react-router'
import { CloudIcon, SpinnerIcon, WarningIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-date'
import { useWorkspace } from '../../hooks/use-workspace'
import { useSync } from '../../sync/sync-context'

/** Counts past this stop reading as a number and start reading as noise. */
const MAX_BADGE_COUNT = 99

const SHELL_CLASSES = cn(
  'flex size-12 items-center justify-center rounded-full transition',
  'bg-content text-surface shadow-lg shadow-black/20',
  'hover:opacity-90 active:scale-95',
  'focus-visible:ring-content/30 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
)

/**
 * Floating sync trigger, anchored to the bottom-right of the content area on
 * every screen size. The sidebar keeps its own [`SyncButton`] — that one is
 * the status readout you go looking for, this one is the action within thumb
 * reach, which on mobile is the only one visible while the drawer is closed.
 *
 * Unsynced work is surfaced as a bubble counter rather than as text: the
 * number is the whole message at this size.
 */
export function SyncFab() {
  const { isConfigured, status, error, lastSyncedAt, sync } = useSync()
  const { pendingCount } = useWorkspace()

  // Positioned by the caller's container. The inset clears the iOS home
  // indicator, which otherwise sits under a bottom-right control.
  const position = 'absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10'

  if (!isConfigured) {
    return (
      <Link to="/settings" aria-label="Connect GitHub" title="Connect GitHub" className={position}>
        <span className={SHELL_CLASSES}>
          <CloudIcon className="size-5" />
        </span>
      </Link>
    )
  }

  const isSyncing = status === 'syncing'
  const hasPending = pendingCount > 0 && !isSyncing

  const label = isSyncing
    ? 'Syncing…'
    : hasPending
      ? `Sync ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
      : `Sync — last synced ${formatRelativeTime(lastSyncedAt ?? 0)}`

  return (
    <div className={position}>
      <button
        type="button"
        onClick={() => void sync()}
        disabled={isSyncing}
        aria-label={label}
        title={error ?? label}
        className={cn(SHELL_CLASSES, 'cursor-pointer disabled:cursor-default disabled:opacity-70')}
      >
        {isSyncing ? (
          <SpinnerIcon className="size-5 animate-spin" />
        ) : status === 'error' ? (
          <WarningIcon className="size-5 text-amber-400" />
        ) : (
          <CloudIcon className="size-5" />
        )}
      </button>

      {hasPending && (
        // `aria-hidden`: the count is already spoken as part of the button's
        // label, and the bubble is not focusable on its own.
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-1 -right-1',
            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
            'bg-blue-600 text-[11px] font-semibold text-white tabular-nums',
            'ring-surface ring-2',
          )}
        >
          {pendingCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : pendingCount}
        </span>
      )}
    </div>
  )
}

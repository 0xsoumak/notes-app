import { SyncIcon, SpinnerIcon, WarningIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-date'
import { useWorkspace } from '../../hooks/use-workspace'
import { useSync } from '../../sync/sync-context'

/** Counts past this stop reading as a number and start reading as noise. */
const MAX_BADGE_COUNT = 99

const SHELL_CLASSES = cn(
  'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition',
  'text-content-muted hover:bg-surface-hover hover:text-content',
  'disabled:cursor-default disabled:opacity-70',
  'focus-visible:ring-content/20 focus-visible:ring-2 focus-visible:outline-none',
)

/**
 * Sync trigger pinned to the top-right of the content area on every screen size.
 * The sidebar keeps its own [`SyncButton`] — that one is the status readout you
 * go looking for, this one is the always-visible action, which on mobile is the
 * only one reachable while the drawer is closed.
 *
 * It sits over the note, so it stays quiet: an icon and, when there is work
 * waiting, a count. At this size the number is the whole message, and no
 * container is needed to carry it.
 */
interface SyncFabProps {
  /** See [`SyncButton`]'s note on why this crosses in as a prop. */
  onConnect: () => void
}

export function SyncFab({ onConnect }: SyncFabProps) {
  const { isConfigured, status, error, lastSyncedAt, sync } = useSync()
  const { pendingCount } = useWorkspace()

  // Positioned by the caller's container. Below `md` that container starts with
  // the 3rem app header, whose own search button already owns the top-right
  // corner — so the button drops clear of it rather than sitting on top.
  const position = 'absolute right-3 top-14 z-10 md:top-3'

  if (!isConfigured) {
    return (
      <button
        type="button"
        onClick={onConnect}
        aria-label="Connect GitHub"
        title="Connect GitHub"
        className={cn(position, SHELL_CLASSES)}
      >
        <SyncIcon className="size-5" />
      </button>
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
    <button
      type="button"
      onClick={() => void sync()}
      disabled={isSyncing}
      aria-label={label}
      title={error ?? label}
      className={cn(position, SHELL_CLASSES)}
    >
      {isSyncing ? (
        <SpinnerIcon className="size-5 animate-spin" />
      ) : status === 'error' ? (
        <WarningIcon className="size-5 text-amber-500" />
      ) : (
        <SyncIcon className="size-5" />
      )}

      {hasPending && (
        // `aria-hidden`: the count is already spoken as part of the button's
        // label, and it is not focusable on its own.
        <span aria-hidden="true" className="text-xs font-medium tabular-nums">
          {pendingCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : pendingCount}
        </span>
      )}
    </button>
  )
}

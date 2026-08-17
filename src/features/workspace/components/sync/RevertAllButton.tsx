import { useEffect, useState } from 'react'
import { RevertIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useWorkspace } from '../../hooks/use-workspace'

const ROW_CLASS =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition'

/**
 * Discards every unpushed change in the workspace, restoring the last synced
 * state of every note.
 *
 * Sits at the foot of the sidebar next to [`SyncButton`] and appears only when
 * there is something to discard — it is the counterweight to the pending count
 * shown right above it, and the only way back for a note deleted on its own,
 * which leaves no row in the tree to revert from.
 *
 * Losing work here is unrecoverable, so the button asks first. The confirmation
 * is the row itself rather than a dialog: the sidebar is already a narrow strip
 * of controls, and a modal over it would be more ceremony than the action.
 */
export function RevertAllButton() {
  const { changedIds, revertAll } = useWorkspace()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReverting, setIsReverting] = useState(false)

  const count = changedIds.size

  // A sync landing (or an edit elsewhere) while the prompt is open would leave
  // it asking about a number that no longer holds.
  useEffect(() => {
    if (count === 0) setIsConfirming(false)
  }, [count])

  if (count === 0) return null

  const handleRevert = async () => {
    setIsReverting(true)
    try {
      await revertAll()
    } finally {
      setIsReverting(false)
      setIsConfirming(false)
    }
  }

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className={cn(ROW_CLASS, 'text-content-muted hover:bg-surface-hover hover:text-content')}
      >
        <RevertIcon className="size-4" />
        <span className="flex-1">Revert all changes</span>
        <span className="bg-content-muted/20 text-content rounded-full px-1.5 py-0.5 text-[10px]">
          {count}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-1 px-2 py-1">
      <p className="text-content-muted text-[11px]">
        Discard local changes to {count} item{count === 1 ? '' : 's'}? This cannot be undone.
      </p>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => void handleRevert()}
          disabled={isReverting}
          className={cn(
            'flex-1 cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition',
            'bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400',
            'disabled:cursor-default disabled:opacity-60',
          )}
        >
          {isReverting ? 'Reverting…' : 'Discard'}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="text-content-muted hover:bg-surface-hover hover:text-content flex-1 cursor-pointer rounded-md px-2 py-1 text-xs transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

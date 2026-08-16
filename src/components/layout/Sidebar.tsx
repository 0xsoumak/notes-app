import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import { IconButton } from '@/components/ui/IconButton'
import { NewFolderIcon, NewNoteIcon, SearchIcon, SettingsIcon, XIcon } from '@/components/ui/icons'
import { COMMAND_MENU_SHORTCUT, useCommandMenu } from '@/features/command-menu'
import { useSettingsDialog } from '@/features/settings'
import { SyncButton, TreeView, useExpandedIds, useNotePath, useWorkspace } from '@/features/workspace'
import { cn } from '@/lib/cn'

interface SidebarProps {
  /** Supplied only when the sidebar is a drawer, which needs its own dismiss. */
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { items, isLoading, createNote, createFolder } = useWorkspace()
  const { expandedIds, toggle, expand } = useExpandedIds()
  const activeNoteId = useNotePath()
  const navigate = useNavigate()
  const commandMenu = useCommandMenu()
  const settingsDialog = useSettingsDialog()

  const handleCreateNote = async () => {
    const path = await createNote(null)
    void navigate(noteRoute(path))
  }

  return (
    <aside className="bg-surface-muted border-border-subtle flex h-full w-full shrink-0 flex-col border-r md:w-64">
      <div className="flex items-center gap-1 px-3 py-3">
        <span className="text-content flex-1 text-sm font-semibold">Notes</span>
        <IconButton label="New note" onClick={() => void handleCreateNote()}>
          <NewNoteIcon className="size-4" />
        </IconButton>
        <IconButton label="New folder" onClick={() => void createFolder(null)}>
          <NewFolderIcon className="size-4" />
        </IconButton>
        {onClose && (
          <IconButton label="Close navigation" onClick={onClose}>
            <XIcon className="size-4" />
          </IconButton>
        )}
      </div>

      <div className="px-3 pb-2">
        {/* Looks like a field but is a button: typing happens in the command
            menu, so the box only has to be the thing you click. */}
        <button
          type="button"
          onClick={commandMenu.open}
          className={cn(
            'border-border-subtle bg-surface flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition',
            'hover:border-content-muted/40 focus-visible:border-content-muted/40 focus-visible:outline-none',
          )}
        >
          <SearchIcon className="text-content-muted size-3.5 shrink-0" />
          <span className="text-content-muted/70 flex-1 text-left text-xs">Search</span>
          <kbd className="border-border-subtle text-content-muted/70 rounded border px-1 py-px text-[10px] font-sans">
            {COMMAND_MENU_SHORTCUT}
          </kbd>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <p className="text-content-muted px-2 py-6 text-center text-xs">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-content-muted px-2 py-6 text-center text-xs">
            Nothing here yet. Create a note or folder above.
          </p>
        ) : (
          <TreeView
            activeNoteId={activeNoteId}
            expandedIds={expandedIds}
            onToggle={toggle}
            onExpand={expand}
          />
        )}
      </nav>

      <div className="border-border-subtle space-y-1 border-t px-2 py-2">
        <SyncButton onConnect={() => settingsDialog.open('github')} />
        <button
          type="button"
          onClick={() => settingsDialog.open()}
          className="text-content-muted hover:bg-surface-hover hover:text-content flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition"
        >
          <SettingsIcon className="size-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}

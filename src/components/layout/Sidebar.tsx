import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { IconButton } from '@/components/ui/IconButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NewFolderIcon, NewNoteIcon, SearchIcon } from '@/components/ui/icons'
import {
  TreeSearchResults,
  TreeView,
  useExpandedIds,
  useWorkspace,
} from '@/features/workspace'

export function Sidebar() {
  const { items, status, createNote, createFolder } = useWorkspace()
  const { expandedIds, toggle, expand } = useExpandedIds()
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!trimmedQuery) return []
    return items.filter((item) => item.title.toLowerCase().includes(trimmedQuery))
  }, [items, trimmedQuery])

  const handleCreateNote = async () => {
    const note = await createNote(null)
    void navigate(`/notes/${note.id}`)
  }

  return (
    <aside className="bg-surface-muted border-border-subtle flex h-full w-64 shrink-0 flex-col border-r">
      <div className="flex items-center gap-1 px-3 py-3">
        <span className="text-content flex-1 text-sm font-semibold">Notes</span>
        <IconButton label="New note" onClick={() => void handleCreateNote()}>
          <NewNoteIcon className="size-4" />
        </IconButton>
        <IconButton label="New folder" onClick={() => void createFolder(null)}>
          <NewFolderIcon className="size-4" />
        </IconButton>
        <ThemeToggle />
      </div>

      <div className="px-3 pb-2">
        <div className="focus-within:border-content-muted/40 border-border-subtle bg-surface flex items-center gap-2 rounded-md border px-2 py-1.5 transition">
          <SearchIcon className="text-content-muted size-3.5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search notes and folders"
            className="placeholder:text-content-muted/70 w-full bg-transparent text-xs outline-none"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {status === 'loading' ? (
          <p className="text-content-muted px-2 py-6 text-center text-xs">Loading…</p>
        ) : trimmedQuery ? (
          <TreeSearchResults matches={matches} />
        ) : items.length === 0 ? (
          <p className="text-content-muted px-2 py-6 text-center text-xs">
            Nothing here yet. Create a note or folder above.
          </p>
        ) : (
          <TreeView
            activeNoteId={noteId}
            expandedIds={expandedIds}
            onToggle={toggle}
            onExpand={expand}
          />
        )}
      </nav>
    </aside>
  )
}

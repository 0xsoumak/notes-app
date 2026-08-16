import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PlusIcon, SearchIcon } from '@/components/ui/icons'
import { NoteList, useNotes } from '@/features/notes'

export function Sidebar() {
  const { notes, status, createNote, deleteNote } = useNotes()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const visibleNotes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return notes
    return notes.filter((note) => note.title.toLowerCase().includes(needle))
  }, [notes, query])

  const handleCreate = async () => {
    const note = await createNote()
    void navigate(`/notes/${note.id}`)
  }

  const handleDelete = async (id: string) => {
    await deleteNote(id)
    void navigate('/')
  }

  return (
    <aside className="bg-surface-muted border-border-subtle flex h-full w-64 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <span className="text-content text-sm font-semibold">Notes</span>
        <ThemeToggle />
      </div>

      <div className="px-3 pb-2">
        <div className="focus-within:border-content-muted/40 border-border-subtle bg-surface flex items-center gap-2 rounded-md border px-2 py-1.5 transition">
          <SearchIcon className="text-content-muted size-3.5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
            className="placeholder:text-content-muted/70 w-full bg-transparent text-xs outline-none"
          />
        </div>
      </div>

      <div className="px-3 pb-2">
        <Button size="sm" onClick={() => void handleCreate()} className="w-full justify-start">
          <PlusIcon className="size-3.5" />
          New note
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {status === 'loading' ? (
          <p className="text-content-muted px-2 py-6 text-center text-xs">Loading…</p>
        ) : (
          <NoteList
            notes={visibleNotes}
            onDelete={(id) => void handleDelete(id)}
            emptyMessage={query ? 'No notes match your search.' : 'No notes yet.'}
          />
        )}
      </nav>
    </aside>
  )
}

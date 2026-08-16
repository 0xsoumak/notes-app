import type { Note } from '../types'
import { NoteListItem } from './NoteListItem'

interface NoteListProps {
  notes: Note[]
  onDelete: (id: string) => void
  emptyMessage: string
}

export function NoteList({ notes, onDelete, emptyMessage }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="text-content-muted px-2 py-6 text-center text-xs">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-0.5">
      {notes.map((note) => (
        <NoteListItem key={note.id} note={note} onDelete={onDelete} />
      ))}
    </ul>
  )
}

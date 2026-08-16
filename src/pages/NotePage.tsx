import { useParams } from 'react-router'
import { EmptyState } from '@/components/layout/EmptyState'
import { FileIcon } from '@/components/ui/icons'
import { NoteEditor, useNote } from '@/features/workspace'

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>()
  const { note, isLoading, isMissing, saveNote } = useNote(noteId)

  if (isLoading) {
    return <p className="text-content-muted p-12 text-sm">Loading note…</p>
  }

  if (isMissing || !note) {
    return (
      <EmptyState
        icon={<FileIcon className="size-10" />}
        title="Note not found"
        description="This note may have been deleted. Choose another from the sidebar."
      />
    )
  }

  // Remounting per note gives the editor a fresh document to seed from.
  return <NoteEditor key={note.id} note={note} onChange={saveNote} />
}

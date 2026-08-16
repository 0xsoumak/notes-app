import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import { EmptyState } from '@/components/layout/EmptyState'
import { FileIcon } from '@/components/ui/icons'
import { NoteEditor, useNote, useNotePath, useWorkspace } from '@/features/workspace'

export function NotePage() {
  const path = useNotePath()
  const { note, content, isLoading, isMissing, saveContent } = useNote(path)
  const { renameItem, setItemIcon } = useWorkspace()
  const navigate = useNavigate()

  if (isLoading) {
    return <p className="text-content-muted p-12 text-sm">Loading note…</p>
  }

  if (isMissing || !note || content === undefined) {
    return (
      <EmptyState
        icon={<FileIcon className="size-10" />}
        title="Note not found"
        description="This note may have been deleted or moved. Choose another from the sidebar."
      />
    )
  }

  // Renaming moves the file, so the URL has to follow it to its new path.
  const handleRename = async (title: string) => {
    const nextPath = await renameItem(note.id, title)
    if (nextPath !== note.id) void navigate(noteRoute(nextPath), { replace: true })
  }

  return (
    <NoteEditor
      key={note.id}
      note={note}
      content={content}
      onContentChange={saveContent}
      onTitleChange={(title) => void handleRename(title)}
      onIconChange={(icon) => void setItemIcon(note.id, icon)}
    />
  )
}

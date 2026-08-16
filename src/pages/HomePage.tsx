import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/Button'
import { FileIcon, PlusIcon } from '@/components/ui/icons'
import { useNotes } from '@/features/notes'

export function HomePage() {
  const { createNote } = useNotes()
  const navigate = useNavigate()

  const handleCreate = async () => {
    const note = await createNote()
    void navigate(`/notes/${note.id}`)
  }

  return (
    <EmptyState
      icon={<FileIcon className="size-10" />}
      title="No note open"
      description="Pick a note from the sidebar, or start a new one to begin writing."
      action={
        <Button variant="primary" onClick={() => void handleCreate()} className="mt-1">
          <PlusIcon className="size-4" />
          New note
        </Button>
      }
    />
  )
}

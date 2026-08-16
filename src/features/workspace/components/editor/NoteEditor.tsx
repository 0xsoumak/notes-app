import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useTheme } from '@/app/providers/theme-context'
import { formatRelativeTime } from '@/lib/format-date'
import type { ItemPatch, NoteItem } from '../../types'
import { NoteTitle } from './NoteTitle'

interface NoteEditorProps {
  note: NoteItem
  onChange: (patch: ItemPatch) => void
}

/**
 * Title + rich-text body for a single note.
 *
 * BlockNote seeds its document once at creation, so callers must remount this
 * component per note (`key={note.id}`) when switching between notes.
 */
export function NoteEditor({ note, onChange }: NoteEditorProps) {
  const { theme } = useTheme()

  const editor = useCreateBlockNote({
    // BlockNote rejects an empty array, so hand it `undefined` for a new note.
    initialContent: note.content.length > 0 ? note.content : undefined,
  })

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-12">
      <NoteTitle
        title={note.title}
        icon={note.icon}
        onTitleChange={(title) => onChange({ title })}
        onIconChange={(icon) => onChange({ icon })}
        onCommit={() => editor.focus()}
      />

      <p className="text-content-muted mb-6 text-xs">
        Edited {formatRelativeTime(note.updatedAt)}
      </p>

      <BlockNoteView
        editor={editor}
        theme={theme}
        onChange={() => onChange({ content: editor.document })}
      />
    </article>
  )
}

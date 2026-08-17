import { EditorContent, useEditor } from '@tiptap/react'
import { useMemo } from 'react'
import type { NoteItem } from '../../types'
import { createEditorExtensions } from './extensions'
import { FormatMenu } from './FormatMenu'
import { NoteTitle } from './NoteTitle'
import { SuggestionController } from './suggestion'
import { SuggestionMenu } from './SuggestionMenu'
import { TableMenu } from './TableMenu'

interface NoteEditorProps {
  note: NoteItem
  /** Markdown body loaded from IndexedDB. */
  content: string
  onContentChange: (markdown: string) => void
  onTitleChange: (title: string) => void
  onIconChange: (icon: string) => void
}

/**
 * Title + rich-text body for a single note.
 *
 * Markdown is the only storage format: the body is parsed from markdown when
 * the editor is constructed and serialised straight back on every change.
 * Because the seed happens at construction rather than in an effect, opening a
 * note fires no spurious change and cannot mark it dirty.
 *
 * Callers must remount this per note (`key={note.id}`) so the right document is
 * loaded.
 */
export function NoteEditor({
  note,
  content,
  onContentChange,
  onTitleChange,
  onIconChange,
}: NoteEditorProps) {
  const suggestions = useMemo(() => new SuggestionController(), [])

  const editor = useEditor({
    extensions: useMemo(() => createEditorExtensions(suggestions), [suggestions]),
    content,
    contentType: 'markdown',
    onUpdate: ({ editor }) => onContentChange(editor.getMarkdown()),
    // Memoised: `useEditor` diffs its options on every render and pushes any
    // change straight through to the ProseMirror view.
    editorProps: useMemo(() => ({ attributes: { class: 'tiptap-body' } }), []),
  })

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-12 sm:py-12">
      <NoteTitle
        title={note.title}
        icon={note.icon}
        onTitleChange={onTitleChange}
        onIconChange={onIconChange}
        onCommit={() => editor?.commands.focus('start')}
      />

      <EditorContent editor={editor} />

      {editor && (
        <>
          <FormatMenu editor={editor} />
          <TableMenu editor={editor} />
          <SuggestionMenu controller={suggestions} />
        </>
      )}
    </article>
  )
}

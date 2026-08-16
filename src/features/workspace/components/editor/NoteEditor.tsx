import { useTheme } from '@/app/providers/theme-context'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useEffect, useRef, useState } from 'react'
import type { NoteItem } from '../../types'
import { NoteTitle } from './NoteTitle'

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
 * Notes are stored as plain markdown, so the editor parses markdown in on
 * mount and serialises back out on every change. Both conversions are
 * asynchronous, and BlockNote's markdown export is lossy by design.
 *
 * Callers must remount this per note (`key={note.id}`) so the hydration effect
 * runs against the right document.
 */
export function NoteEditor({
  note,
  content,
  onContentChange,
  onTitleChange,
  onIconChange,
}: NoteEditorProps) {
  const { resolvedTheme } = useTheme()
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration replaces the document, which fires onChange. Without this guard
  // every note would be marked dirty just by being opened.
  const isHydratingRef = useRef(true)

  const editor = useCreateBlockNote()

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(content)
      if (cancelled) return

      // An empty note still needs one empty block to be editable.
      editor.replaceBlocks(editor.document, blocks.length > 0 ? blocks : [{ type: 'paragraph' }])
      isHydratingRef.current = false
      setIsHydrated(true)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
    // `content` is deliberately not a dependency: this seeds the editor once,
    // and re-running it on every keystroke would fight the user's cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  const handleChange = async () => {
    if (isHydratingRef.current) return
    onContentChange(await editor.blocksToMarkdownLossy(editor.document))
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-12 sm:py-12">
      <NoteTitle
        title={note.title}
        icon={note.icon}
        onTitleChange={onTitleChange}
        onIconChange={onIconChange}
        onCommit={() => editor.focus()}
      />

      <div className={isHydrated ? undefined : 'invisible'}>
        <BlockNoteView editor={editor} theme={resolvedTheme} onChange={() => void handleChange()} />
      </div>
    </article>
  )
}

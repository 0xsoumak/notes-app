import { useImperativeHandle, useState, type Ref } from 'react'

interface TreeRowLabelProps {
  title: string
  /** Open the note, or toggle the folder. */
  onActivate: () => void
  onRename: (title: string) => void
  /** Lets the context menu's "Rename" item reach into the same edit state. */
  ref?: Ref<TreeRowLabelHandle>
}

export interface TreeRowLabelHandle {
  startEditing: () => void
}

/**
 * The row's text. Single click activates the row, double click switches it into
 * an inline rename field. The same field can be opened imperatively — the
 * context menu's "Rename" has no double click of its own to hook.
 */
export function TreeRowLabel({ title, onActivate, onRename, ref }: TreeRowLabelProps) {
  const [draft, setDraft] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({ startEditing: () => setDraft(title) }), [title])

  const commit = () => {
    if (draft === null) return
    const trimmed = draft.trim()
    if (trimmed && trimmed !== title) onRename(trimmed)
    setDraft(null)
  }

  if (draft !== null) {
    return (
      <input
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setDraft(null)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Rename"
        className="border-content-muted/40 bg-surface text-content min-w-0 flex-1 rounded border px-1 py-0 text-sm outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      onDoubleClick={() => setDraft(title)}
      className="min-w-0 flex-1 cursor-pointer truncate text-left"
    >
      {title || 'Untitled'}
    </button>
  )
}

import { useState } from 'react'

interface TreeRowLabelProps {
  title: string
  /** Open the note, or toggle the folder. */
  onActivate: () => void
  onRename: (title: string) => void
}

/**
 * The row's text. Single click activates the row, double click switches it into
 * an inline rename field.
 */
export function TreeRowLabel({ title, onActivate, onRename }: TreeRowLabelProps) {
  const [draft, setDraft] = useState<string | null>(null)

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

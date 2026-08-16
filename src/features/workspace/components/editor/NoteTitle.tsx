import { useRef } from 'react'
import { NoteIconPicker } from './NoteIconPicker'

interface NoteTitleProps {
  title: string
  icon: string
  /** Fires on blur or Enter only — the title is the file name, so every change is a rename. */
  onTitleChange: (title: string) => void
  onIconChange: (icon: string) => void
  /** Fired when the user presses Enter, so the caller can focus the body. */
  onCommit: () => void
}

/**
 * Uncontrolled title field: the parent remounts this per note, so `defaultValue`
 * stays in sync without fighting the save round-trip.
 */
export function NoteTitle({ title, icon, onTitleChange, onIconChange, onCommit }: NoteTitleProps) {
  const committedRef = useRef(title)

  const commit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === committedRef.current) return
    committedRef.current = trimmed
    onTitleChange(trimmed)
  }

  return (
    <header className="mb-2 flex items-center gap-2">
      <NoteIconPicker icon={icon} onChange={onIconChange} />

      <textarea
        defaultValue={title}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          commit(event.currentTarget.value)
          onCommit()
        }}
        rows={1}
        placeholder="Untitled"
        aria-label="Note title"
        spellCheck={false}
        className="placeholder:text-content-muted/50 field-sizing-content min-w-0 flex-1 resize-none bg-transparent text-3xl leading-tight font-bold outline-none sm:text-4xl"
      />
    </header>
  )
}

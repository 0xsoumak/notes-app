import { NoteIconPicker } from './NoteIconPicker'

interface NoteTitleProps {
  title: string
  icon: string
  onTitleChange: (title: string) => void
  onIconChange: (icon: string) => void
  /** Fired when the user presses Enter, so the caller can focus the body. */
  onCommit: () => void
}

/**
 * Uncontrolled title field: the parent remounts this per note, so `defaultValue`
 * stays in sync without fighting the debounced save round-trip.
 */
export function NoteTitle({
  title,
  icon,
  onTitleChange,
  onIconChange,
  onCommit,
}: NoteTitleProps) {
  return (
    <header className="mb-2">
      <NoteIconPicker icon={icon} onChange={onIconChange} />

      <textarea
        defaultValue={title}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          onCommit()
        }}
        rows={1}
        placeholder="Untitled"
        aria-label="Note title"
        spellCheck={false}
        className="placeholder:text-content-muted/50 field-sizing-content mt-2 w-full resize-none bg-transparent text-4xl leading-tight font-bold outline-none"
      />
    </header>
  )
}

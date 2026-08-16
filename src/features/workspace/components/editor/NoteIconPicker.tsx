import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const ICON_CHOICES = [
  '📄', '📝', '📌', '📚', '🗂️', '🧠', '💡', '🎯',
  '🚀', '🔥', '✅', '⭐', '🐛', '🧪', '🎨', '☕',
]

interface NoteIconPickerProps {
  icon: string
  onChange: (icon: string) => void
}

/** Small emoji popover — a stand-in for a full picker until one is needed. */
export function NoteIconPicker({ icon, onChange }: NoteIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative w-fit shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Change note icon"
        aria-expanded={isOpen}
        className="hover:bg-surface-hover block cursor-pointer rounded-lg p-1 text-4xl leading-none transition"
      >
        {icon}
      </button>

      {isOpen && (
        <div
          className={cn(
            'bg-surface border-border-subtle absolute top-full left-0 z-20 mt-1',
            'grid w-64 grid-cols-8 gap-1 rounded-lg border p-2 shadow-lg',
          )}
        >
          {ICON_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => {
                onChange(choice)
                setIsOpen(false)
              }}
              className="hover:bg-surface-hover cursor-pointer rounded p-1 text-lg leading-none transition"
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

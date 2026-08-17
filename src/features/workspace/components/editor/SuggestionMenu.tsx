import { useEffect, useRef, useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import type { SuggestionController } from './suggestion'

const MENU_WIDTH = 260
const MENU_MAX_HEIGHT = 280
const GUTTER = 8

/**
 * The popup behind both `/` (block commands) and `:` (emoji).
 *
 * It is positioned against the caret rectangle the ProseMirror plugin hands
 * us, flipping above the caret when there is no room below. Keyboard handling
 * lives in the plugin — this only renders and forwards pointer input.
 */
export function SuggestionMenu({ controller }: { controller: SuggestionController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Arrow keys move the highlight past the visible window; follow it.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [state?.activeIndex])

  if (!state || !state.rect || state.items.length === 0) return null

  const { rect, items, activeIndex } = state
  const flipsUp = rect.bottom + MENU_MAX_HEIGHT + GUTTER > window.innerHeight
  const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - GUTTER)

  return (
    <div
      role="listbox"
      aria-label="Insert"
      style={{
        top: flipsUp ? undefined : rect.bottom + GUTTER,
        bottom: flipsUp ? window.innerHeight - rect.top + GUTTER : undefined,
        left: Math.max(GUTTER, left),
        width: MENU_WIDTH,
        maxHeight: MENU_MAX_HEIGHT,
      }}
      className="border-border-subtle bg-surface fixed z-50 overflow-y-auto rounded-lg border p-1 shadow-lg"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={index === activeIndex ? activeRef : undefined}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          // The editor must keep focus, or the suggestion range collapses
          // before the command can run.
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => controller.select(index)}
          onClick={() => controller.choose(index)}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm',
            index === activeIndex ? 'bg-surface-hover text-content' : 'text-content-muted',
          )}
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-base">
            {item.glyph}
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.hint && <span className="text-content-muted/70 truncate text-xs">{item.hint}</span>}
        </button>
      ))}
    </div>
  )
}

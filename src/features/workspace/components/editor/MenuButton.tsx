import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface MenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  /** Renders the button as pressed — the mark or node is applied here. */
  isActive?: boolean
  /**
   * `icon` is a square glyph button; `text` shows the label itself, for actions
   * no icon distinguishes — "delete row" and "delete column" look identical.
   */
  variant?: 'icon' | 'text'
  children?: ReactNode
}

/**
 * A button inside a floating editor toolbar.
 *
 * `mousedown` is swallowed: moving focus out of the editor collapses the
 * selection the command is about to act on.
 */
export function MenuButton({
  label,
  isActive,
  variant = 'icon',
  className,
  children,
  ...props
}: MenuButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'inline-flex h-7 cursor-pointer items-center justify-center rounded transition',
        variant === 'icon' ? 'w-7 text-base' : 'px-2 text-xs whitespace-nowrap',
        'hover:bg-surface-hover focus-visible:ring-content/30 focus-visible:ring-2',
        'focus-visible:outline-none',
        isActive ? 'text-accent' : 'text-content-muted hover:text-content',
        className,
      )}
      {...props}
    >
      {children ?? label}
    </button>
  )
}

/** Hairline separator between groups of {@link MenuButton}s. */
export function MenuDivider() {
  return <span aria-hidden className="bg-border-subtle mx-0.5 h-5 w-px" />
}

/** The floating toolbar shell shared by the format and table menus. */
export function MenuBar({ children }: { children: ReactNode }) {
  return (
    <div className="border-border-subtle bg-surface flex items-center gap-0.5 rounded-lg border p-1 shadow-lg">
      {children}
    </div>
  )
}

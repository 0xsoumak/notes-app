import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon alone gives screen readers nothing to announce. */
  label: string
  children: ReactNode
}

/** A square, icon-only button used throughout the chrome. */
export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'text-content-muted inline-flex size-6 cursor-pointer items-center justify-center rounded',
        'hover:bg-surface-hover hover:text-content transition',
        'focus-visible:ring-content/30 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

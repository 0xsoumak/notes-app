import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CommandMenu } from './CommandMenu'
import { CommandMenuContext, type CommandMenuContextValue } from './command-menu-context'

interface CommandMenuProviderProps {
  children: ReactNode
}

/**
 * Owns whether the palette is open, and the ⌘K / Ctrl+K binding that opens it.
 *
 * The menu is mounted only while open so its query and selection start clean
 * every time, and so nothing of it is on the page — or in the tab order —
 * while the user is writing.
 */
export function CommandMenuProvider({ children }: CommandMenuProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'k' && event.key !== 'K') return
      if (!event.metaKey && !event.ctrlKey) return

      // Browsers bind ⌘K/Ctrl+K to the address bar, and the editor binds it to
      // "insert link", so this has to be claimed rather than merely observed.
      event.preventDefault()
      setIsOpen((wasOpen) => !wasOpen)
    }

    // Capture phase: the shortcut has to work from inside the editor, which
    // stops plenty of key events from reaching the window.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const value = useMemo<CommandMenuContextValue>(
    () => ({ isOpen, open, close }),
    [isOpen, open, close],
  )

  return (
    <CommandMenuContext value={value}>
      {children}
      {isOpen && <CommandMenu onClose={close} />}
    </CommandMenuContext>
  )
}

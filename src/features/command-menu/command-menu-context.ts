import { createContext, use } from 'react'

export interface CommandMenuContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const CommandMenuContext = createContext<CommandMenuContextValue | null>(null)

/** Opens the palette from anywhere in the chrome — a search box, a toolbar. */
export function useCommandMenu(): CommandMenuContextValue {
  const context = use(CommandMenuContext)
  if (!context) {
    throw new Error('useCommandMenu must be used within a <CommandMenuProvider>')
  }
  return context
}

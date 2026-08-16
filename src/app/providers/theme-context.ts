import { createContext, use } from 'react'

/** What the user picked. `system` tracks the OS setting rather than fixing one. */
export type ThemePreference = 'system' | 'light' | 'dark'
/** What's actually painted — `system` resolved against the OS at read time. */
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return context
}

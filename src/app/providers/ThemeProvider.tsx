import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme, type ThemeContextValue } from './theme-context'

const STORAGE_KEY = 'notes-app:theme'

/**
 * Browser UI painted around the app — the status bar on Android, the title bar
 * of an installed window. Kept level with the app's own surface so a standalone
 * install has no seam at the top.
 */
const THEME_COLORS = { light: '#ffffff', dark: '#191919' } as const

function readInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(STORAGE_KEY, theme)

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}

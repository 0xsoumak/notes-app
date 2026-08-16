import { useTheme } from '@/app/providers/theme-context'
import { IconButton } from './IconButton'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <IconButton label={`Switch to ${nextTheme} theme`} onClick={toggleTheme}>
      {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </IconButton>
  )
}

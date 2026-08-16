import { useTheme } from '@/app/providers/theme-context'
import type { ThemePreference } from '@/app/providers/theme-context'
import { MoonIcon, PaletteIcon, SunIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof SunIcon }[] = [
  { value: 'system', label: 'System', icon: PaletteIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
]

export function AppearancePanel() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <h2 className="text-content text-lg font-semibold">Appearance</h2>
      <p className="text-content-muted mt-1 text-sm">
        Choose how Notes looks. "System" follows your OS setting and switches automatically.
      </p>

      <div className="border-border-subtle bg-surface-muted mt-6 inline-flex rounded-lg border p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme === value}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition',
              theme === value
                ? 'bg-surface text-content shadow-sm'
                : 'text-content-muted hover:text-content',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

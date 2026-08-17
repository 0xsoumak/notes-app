import { Dialog } from '@base-ui/react/dialog'
import { Tabs } from '@base-ui/react/tabs'
import { GitHubIcon, PaletteIcon, XIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { AppearancePanel } from './components/AppearancePanel'
import { GitHubPanel } from './components/GitHubPanel'
import type { SettingsTab } from './settings-dialog-context'

/** Below this the dialog becomes a full-screen sheet with the tab list moved to the top. */
const SIDEBAR_QUERY = '(min-width: 640px)'

const TABS: { value: SettingsTab; label: string; icon: typeof PaletteIcon }[] = [
  { value: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { value: 'github', label: 'GitHub', icon: GitHubIcon },
]

const TAB_CLASS = cn(
  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition',
  'sm:flex-none sm:w-full sm:justify-start sm:text-left',
  'text-content-muted hover:bg-surface-hover hover:text-content',
  'data-active:bg-surface-hover data-active:text-content data-active:font-medium',
)

interface SettingsDialogProps {
  open: boolean
  tab: SettingsTab
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: SettingsTab) => void
}

/**
 * Settings as a dialog rather than a route — Notion and Linear both treat
 * preferences this way, and it means opening them never loses the note you
 * had open behind it. Two vertical tabs for now; the list only grows here.
 */
export function SettingsDialog({ open, tab, onOpenChange, onTabChange }: SettingsDialogProps) {
  const hasSidebar = useMediaQuery(SIDEBAR_QUERY)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />

        <Dialog.Popup
          className={cn(
            'bg-surface border-border-subtle fixed z-50 flex flex-col overflow-hidden shadow-2xl shadow-black/25',
            'inset-0 h-full w-full rounded-none border-0',
            'sm:top-1/2 sm:left-1/2 sm:inset-auto sm:h-[min(85vh,34rem)] sm:w-[calc(100%-2rem)] sm:max-w-2xl',
            'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border',
          )}
        >
          <div className="border-border-subtle flex shrink-0 items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="text-content text-sm font-semibold">Settings</Dialog.Title>
            <Dialog.Close
              aria-label="Close settings"
              className={cn(
                'text-content-muted inline-flex size-6 cursor-pointer items-center justify-center rounded',
                'hover:bg-surface-hover hover:text-content transition',
                'focus-visible:ring-content/30 focus-visible:ring-2 focus-visible:outline-none',
              )}
            >
              <XIcon className="size-4" />
            </Dialog.Close>
          </div>

          <Tabs.Root
            orientation={hasSidebar ? 'vertical' : 'horizontal'}
            value={tab}
            onValueChange={(value) => onTabChange(value as SettingsTab)}
            className="flex min-h-0 flex-1 flex-col sm:flex-row"
          >
            <Tabs.List className="border-border-subtle bg-surface-muted flex shrink-0 gap-0.5 border-b p-2 sm:w-48 sm:flex-col sm:border-r sm:border-b-0">
              {TABS.map(({ value, label, icon: Icon }) => (
                <Tabs.Tab key={value} value={value} className={TAB_CLASS}>
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <Tabs.Panel value="appearance">
                <AppearancePanel />
              </Tabs.Panel>
              <Tabs.Panel value="github">
                <GitHubPanel />
              </Tabs.Panel>
            </div>
          </Tabs.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

import { Dialog } from '@base-ui/react/dialog'
import { Tabs } from '@base-ui/react/tabs'
import { GitHubIcon, PaletteIcon, XIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { AppearancePanel } from './components/AppearancePanel'
import { GitHubPanel } from './components/GitHubPanel'
import type { SettingsTab } from './settings-dialog-context'

const TABS: { value: SettingsTab; label: string; icon: typeof PaletteIcon }[] = [
  { value: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { value: 'github', label: 'GitHub', icon: GitHubIcon },
]

const TAB_CLASS = cn(
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition',
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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />

        <Dialog.Popup
          className={cn(
            'bg-surface border-border-subtle fixed top-1/2 left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col',
            'h-[min(85vh,34rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border shadow-2xl shadow-black/25',
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
            orientation="vertical"
            value={tab}
            onValueChange={(value) => onTabChange(value as SettingsTab)}
            className="flex min-h-0 flex-1"
          >
            <Tabs.List className="border-border-subtle bg-surface-muted flex w-40 shrink-0 flex-col gap-0.5 border-r p-2 sm:w-48">
              {TABS.map(({ value, label, icon: Icon }) => (
                <Tabs.Tab key={value} value={value} className={TAB_CLASS}>
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            <div className="min-w-0 flex-1 overflow-y-auto p-6">
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

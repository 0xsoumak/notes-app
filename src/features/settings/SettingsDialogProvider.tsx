import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { SettingsDialog } from './SettingsDialog'
import {
  SettingsDialogContext,
  type SettingsDialogContextValue,
  type SettingsTab,
} from './settings-dialog-context'

const DEFAULT_TAB: SettingsTab = 'appearance'

interface SettingsDialogProviderProps {
  children: ReactNode
}

/**
 * Owns whether the settings dialog is open and which tab it's on. A single
 * instance lives at the app root so any control — the sidebar link, "Connect
 * GitHub" prompts, the command menu — can open straight to the tab it means.
 */
export function SettingsDialogProvider({ children }: SettingsDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<SettingsTab>(DEFAULT_TAB)

  const open = useCallback((nextTab: SettingsTab = DEFAULT_TAB) => {
    setTab(nextTab)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo<SettingsDialogContextValue>(
    () => ({ isOpen, tab, open, close, setTab }),
    [isOpen, tab, open, close],
  )

  return (
    <SettingsDialogContext value={value}>
      {children}
      <SettingsDialog open={isOpen} tab={tab} onOpenChange={setIsOpen} onTabChange={setTab} />
    </SettingsDialogContext>
  )
}

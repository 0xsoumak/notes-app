import { createContext, use } from 'react'

export type SettingsTab = 'appearance' | 'github'

export interface SettingsDialogContextValue {
  isOpen: boolean
  /** Which panel is showing — also the panel a fresh `open()` lands on. */
  tab: SettingsTab
  open: (tab?: SettingsTab) => void
  close: () => void
  setTab: (tab: SettingsTab) => void
}

export const SettingsDialogContext = createContext<SettingsDialogContextValue | null>(null)

/** Opens the settings dialog from anywhere in the chrome, to a given tab. */
export function useSettingsDialog(): SettingsDialogContextValue {
  const context = use(SettingsDialogContext)
  if (!context) {
    throw new Error('useSettingsDialog must be used within a <SettingsDialogProvider>')
  }
  return context
}

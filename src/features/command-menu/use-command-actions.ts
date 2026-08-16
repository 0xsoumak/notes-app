import { useMemo, type ComponentType } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '@/app/providers/theme-context'
import { HOME_ROUTE, SETTINGS_ROUTE, noteRoute } from '@/app/routes'
import {
  CloudIcon,
  HomeIcon,
  MoonIcon,
  NewFolderIcon,
  NewNoteIcon,
  SettingsIcon,
  SunIcon,
} from '@/components/ui/icons'
import { useSync, useWorkspace } from '@/features/workspace'

/** Only the props the menu actually passes; keeps icons swappable. */
type ActionIcon = ComponentType<{ className?: string }>

export interface CommandAction {
  id: string
  title: string
  /** Matched against alongside the title, but never shown. */
  keywords?: string
  /** Trailing text — a count, a shortcut, the current value. */
  hint?: string
  icon: ActionIcon
  run: () => void | Promise<void>
}

/**
 * Everything the palette can do besides opening a note.
 *
 * Actions that would be dead ends are left out rather than disabled: with
 * GitHub unconfigured there is nothing to sync, so the list offers to connect
 * it instead.
 */
export function useCommandActions(): CommandAction[] {
  const navigate = useNavigate()
  const { createNote, createFolder, pendingCount } = useWorkspace()
  const { isConfigured, status, sync } = useSync()
  const { theme, toggleTheme } = useTheme()

  return useMemo(() => {
    const actions: CommandAction[] = [
      {
        id: 'new-note',
        title: 'New note',
        keywords: 'create add page',
        icon: NewNoteIcon,
        run: async () => {
          const path = await createNote(null)
          void navigate(noteRoute(path))
        },
      },
      {
        id: 'new-folder',
        title: 'New folder',
        keywords: 'create add directory',
        icon: NewFolderIcon,
        run: () => createFolder(null),
      },
      {
        id: 'home',
        title: 'Go to all notes',
        keywords: 'home index overview',
        icon: HomeIcon,
        run: () => void navigate(HOME_ROUTE),
      },
    ]

    actions.push(
      isConfigured
        ? {
            id: 'sync',
            title: 'Sync now',
            keywords: 'github push pull commit',
            hint: pendingCount > 0 ? `${pendingCount} pending` : undefined,
            icon: CloudIcon,
            // Firing a second sync mid-run would race the first; the sidebar
            // and the floating button disable themselves for the same reason.
            run: () => (status === 'syncing' ? undefined : sync()),
          }
        : {
            id: 'connect',
            title: 'Connect GitHub',
            keywords: 'sync setup repository token',
            icon: CloudIcon,
            run: () => void navigate(SETTINGS_ROUTE),
          },
    )

    actions.push(
      {
        id: 'theme',
        title: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
        keywords: 'dark light appearance toggle',
        icon: theme === 'dark' ? SunIcon : MoonIcon,
        run: toggleTheme,
      },
      {
        id: 'settings',
        title: 'Open settings',
        keywords: 'preferences github repository',
        icon: SettingsIcon,
        run: () => void navigate(SETTINGS_ROUTE),
      },
    )

    return actions
  }, [
    createFolder,
    createNote,
    isConfigured,
    navigate,
    pendingCount,
    status,
    sync,
    theme,
    toggleTheme,
  ])
}

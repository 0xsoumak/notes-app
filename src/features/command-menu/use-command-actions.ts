import { useMemo, type ComponentType } from 'react'
import { useNavigate } from 'react-router'
import { HOME_ROUTE, noteRoute } from '@/app/routes'
import {
  CloudIcon,
  HomeIcon,
  NewFolderIcon,
  NewNoteIcon,
  PaletteIcon,
  SettingsIcon,
} from '@/components/ui/icons'
import { useSettingsDialog } from '@/features/settings'
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
  const settingsDialog = useSettingsDialog()

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

    if (isConfigured) {
      actions.push({
        id: 'sync',
        title: 'Sync now',
        keywords: 'github push pull commit',
        hint: pendingCount > 0 ? `${pendingCount} pending` : undefined,
        icon: CloudIcon,
        // Firing a second sync mid-run would race the first; the sidebar
        // and the floating button disable themselves for the same reason.
        run: () => (status === 'syncing' ? undefined : sync()),
      })
    } else {
      actions.push({
        id: 'connect',
        title: 'Connect GitHub',
        keywords: 'sync setup repository token settings',
        icon: CloudIcon,
        run: () => settingsDialog.open('github'),
      })
    }

    actions.push(
      {
        id: 'appearance',
        title: 'Change appearance',
        keywords: 'theme dark light system settings preferences',
        icon: PaletteIcon,
        run: () => settingsDialog.open('appearance'),
      },
      {
        id: 'settings',
        title: 'Open settings',
        keywords: 'preferences github repository appearance theme',
        icon: SettingsIcon,
        run: () => settingsDialog.open(),
      },
    )

    return actions
  }, [createFolder, createNote, isConfigured, navigate, pendingCount, settingsDialog, status, sync])
}

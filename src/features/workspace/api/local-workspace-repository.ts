import { createId } from '@/lib/id'
import { getChildren, getDescendantIds } from '../tree/flatten-tree'
import type { FolderItem, NoteItem, WorkspaceItem } from '../types'
import type { WorkspaceRepository } from './workspace-repository'

const STORAGE_KEY = 'notes-app:workspace'

export const DEFAULT_NOTE_TITLE = 'Untitled'
export const DEFAULT_NOTE_ICON = '📄'
export const DEFAULT_FOLDER_TITLE = 'New folder'
export const DEFAULT_FOLDER_ICON = '📁'

function readAll(): WorkspaceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as WorkspaceItem[]) : []
  } catch {
    // Corrupt or unavailable storage shouldn't take the app down.
    return []
  }
}

function writeAll(items: WorkspaceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Quota or private-mode failures are non-fatal for the UI phase.
  }
}

/** New items land at the end of their sibling group. */
function nextOrder(items: WorkspaceItem[], parentId: string | null): number {
  return getChildren(items, parentId).length
}

/**
 * localStorage-backed workspace, used while the UI is built ahead of the backend.
 */
export function createLocalWorkspaceRepository(): WorkspaceRepository {
  return {
    async list() {
      return readAll()
    },

    async createFolder(parentId) {
      const items = readAll()
      const now = new Date().toISOString()
      const folder: FolderItem = {
        id: createId(),
        kind: 'folder',
        parentId,
        order: nextOrder(items, parentId),
        title: DEFAULT_FOLDER_TITLE,
        icon: DEFAULT_FOLDER_ICON,
        createdAt: now,
        updatedAt: now,
      }

      writeAll([...items, folder])
      return folder
    },

    async createNote(parentId) {
      const items = readAll()
      const now = new Date().toISOString()
      const note: NoteItem = {
        id: createId(),
        kind: 'note',
        parentId,
        order: nextOrder(items, parentId),
        title: DEFAULT_NOTE_TITLE,
        icon: DEFAULT_NOTE_ICON,
        content: [],
        createdAt: now,
        updatedAt: now,
      }

      writeAll([...items, note])
      return note
    },

    async update(id, patch) {
      const items = readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Workspace item not found: ${id}`)

      const current = items[index]
      const { content, ...shared } = patch
      const updatedAt = new Date().toISOString()

      // Folders have no content, so a stray `content` patch is dropped.
      const updated: WorkspaceItem =
        current.kind === 'folder'
          ? { ...current, ...shared, updatedAt }
          : { ...current, ...shared, content: content ?? current.content, updatedAt }

      items[index] = updated
      writeAll(items)
      return updated
    },

    async remove(id) {
      const items = readAll()
      const removedIds = [id, ...getDescendantIds(items, id)]
      const removed = new Set(removedIds)

      writeAll(items.filter((item) => !removed.has(item.id)))
      return removedIds
    },

    async move(positions) {
      const items = readAll()
      const byId = new Map(positions.map((position) => [position.id, position]))
      const now = new Date().toISOString()

      const next = items.map((item) => {
        const position = byId.get(item.id)
        if (!position) return item
        return { ...item, parentId: position.parentId, order: position.order, updatedAt: now }
      })

      writeAll(next)
      return next.filter((item) => byId.has(item.id))
    },
  }
}

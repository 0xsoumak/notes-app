import { createContext, use } from 'react'
import type { DropTarget } from '../tree/drop-projection'
import type { WorkspaceItem } from '../types'

export interface WorkspaceContextValue {
  items: WorkspaceItem[]
  isLoading: boolean
  /** Number of files with unpushed changes. */
  pendingCount: number
  /** Ids of items with unpushed changes, folders included via their contents. */
  changedIds: ReadonlySet<string>
  createNote: (parentId?: string | null) => Promise<string>
  createFolder: (parentId?: string | null) => Promise<void>
  /** Renaming moves the file, so this resolves to the item's new path. */
  renameItem: (id: string, title: string) => Promise<string>
  setItemIcon: (id: string, icon: string) => Promise<void>
  deleteItem: (id: string) => Promise<string[]>
  /** Applies a drag-and-drop result. Resolves to the dragged item's new path. */
  moveItem: (activeId: string, target: DropTarget) => Promise<string>
  /**
   * Throws away unpushed changes to an item and everything under it. Resolves
   * to where it ended up — undoing a rename moves it, and an item that only
   * ever existed locally is gone, which resolves to `null`.
   */
  revertItem: (id: string) => Promise<string | null>
  /** Throws away every unpushed change. Resolves to how many files were touched. */
  revertAll: () => Promise<number>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = use(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a <WorkspaceProvider>')
  }
  return context
}

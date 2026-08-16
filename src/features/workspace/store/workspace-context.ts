import { createContext, use } from 'react'
import type { DropTarget } from '../tree/drop-projection'
import type { WorkspaceItem } from '../types'

export interface WorkspaceContextValue {
  items: WorkspaceItem[]
  isLoading: boolean
  /** Number of files with unpushed changes. */
  pendingCount: number
  createNote: (parentId?: string | null) => Promise<string>
  createFolder: (parentId?: string | null) => Promise<void>
  /** Renaming moves the file, so this resolves to the item's new path. */
  renameItem: (id: string, title: string) => Promise<string>
  setItemIcon: (id: string, icon: string) => Promise<void>
  deleteItem: (id: string) => Promise<string[]>
  /** Applies a drag-and-drop result. Resolves to the dragged item's new path. */
  moveItem: (activeId: string, target: DropTarget) => Promise<string>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = use(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a <WorkspaceProvider>')
  }
  return context
}

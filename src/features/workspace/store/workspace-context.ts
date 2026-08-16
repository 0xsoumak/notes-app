import { createContext, use } from 'react'
import type { DropTarget } from '../tree/drop-projection'
import type { FolderItem, ItemPatch, NoteItem, WorkspaceItem } from '../types'
import type { WorkspaceStatus } from './workspace-reducer'

export interface WorkspaceContextValue {
  items: WorkspaceItem[]
  status: WorkspaceStatus
  error: string | null
  createNote: (parentId?: string | null) => Promise<NoteItem>
  createFolder: (parentId?: string | null) => Promise<FolderItem>
  updateItem: (id: string, patch: ItemPatch) => Promise<void>
  /** Removes the item and its whole subtree. Resolves to the removed ids. */
  deleteItem: (id: string) => Promise<string[]>
  /** Applies a drag-and-drop result to the tree. */
  moveItem: (activeId: string, target: DropTarget) => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = use(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a <WorkspaceProvider>')
  }
  return context
}

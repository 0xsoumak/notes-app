import type { FolderItem, ItemPatch, ItemPosition, NoteItem, WorkspaceItem } from '../types'

/**
 * The seam between the UI and wherever the workspace actually lives.
 *
 * Every method is async even though today's implementation is synchronous
 * localStorage — that way swapping in an HTTP client requires no changes above
 * this layer.
 */
export interface WorkspaceRepository {
  list(): Promise<WorkspaceItem[]>
  createFolder(parentId: string | null): Promise<FolderItem>
  createNote(parentId: string | null): Promise<NoteItem>
  update(id: string, patch: ItemPatch): Promise<WorkspaceItem>
  /** Removes the item and everything beneath it. Resolves to the removed ids. */
  remove(id: string): Promise<string[]>
  /** Applies a batch of position changes as one atomic move. */
  move(positions: ItemPosition[]): Promise<WorkspaceItem[]>
}

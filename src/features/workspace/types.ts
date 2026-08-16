/**
 * An item's `id` is its repo-relative path — `personal/notes/thoughts/today.md`
 * for a note, `personal/notes/thoughts` for a folder. Folders are implied by
 * paths rather than stored, exactly as Git models them.
 */
interface WorkspaceItemBase {
  id: string
  /** Parent folder path, or `null` at the repo root. */
  parentId: string | null
  /** Position among siblings, contiguous from 0. Sourced from the sidecar index. */
  order: number
  /** Display name — the file name without its `.md` extension. */
  title: string
  icon: string
  updatedAt: number
}

/** A directory. Only folders may have children. */
export interface FolderItem extends WorkspaceItemBase {
  kind: 'folder'
}

/** A `.md` file. Its markdown body is stored separately, keyed by path. */
export interface NoteItem extends WorkspaceItemBase {
  kind: 'note'
  /** Remote blob SHA, or `null` if this note has never been pushed. */
  sha: string | null
  /** True when local edits are waiting to be pushed. */
  isDirty: boolean
}

export type WorkspaceItem = FolderItem | NoteItem

/** Per-path metadata Git cannot represent, kept in the sidecar index file. */
export interface ItemMeta {
  order: number
  icon: string
}

export type NotesIndex = Record<string, ItemMeta>

/** Where an item sits in the tree — the unit of a drag-and-drop move. */
export interface ItemPosition {
  id: string
  parentId: string | null
  order: number
}

export function isFolder(item: WorkspaceItem): item is FolderItem {
  return item.kind === 'folder'
}

export function isNote(item: WorkspaceItem): item is NoteItem {
  return item.kind === 'note'
}

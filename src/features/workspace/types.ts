import type { Block } from '@blocknote/core'

/** A note's body is BlockNote's document model — an array of blocks. */
export type NoteContent = Block[]

interface WorkspaceItemBase {
  id: string
  /** `null` means the item sits at the root of the tree. */
  parentId: string | null
  /** Position among siblings, contiguous from 0. */
  order: number
  title: string
  icon: string
  createdAt: string
  updatedAt: string
}

/** A container. Only folders may have children. */
export interface FolderItem extends WorkspaceItemBase {
  kind: 'folder'
}

/** A leaf holding editable content. */
export interface NoteItem extends WorkspaceItemBase {
  kind: 'note'
  content: NoteContent
}

export type WorkspaceItem = FolderItem | NoteItem

/** The fields a user edits directly. Position and timestamps are not among them. */
export interface ItemPatch {
  title?: string
  icon?: string
  content?: NoteContent
}

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

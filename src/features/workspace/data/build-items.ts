import {
  INDEX_FILE,
  ancestorPaths,
  baseName,
  isHiddenPath,
  isNotePath,
  parentPath,
} from '../paths'
import type { ItemMeta, NotesIndex, WorkspaceItem } from '../types'
import type { LocalFile } from './db'
import { DEFAULT_NOTE_ICON, parseNotesIndex } from './notes-index'
import { hasLocalChanges } from './revert-plan'

const FOLDER_ICON = '📁'

/**
 * Derives the sidebar tree from the flat file list.
 *
 * Folders are not stored anywhere — they are inferred from the path segments
 * of the files beneath them, which is why an empty folder needs a `.gitkeep`
 * to exist at all.
 */
export function buildItems(files: LocalFile[], index: NotesIndex): WorkspaceItem[] {
  const live = files.filter((file) => file.isDeleted === 0)

  const folderPaths = new Set<string>()
  for (const file of live) {
    for (const ancestor of ancestorPaths(file.path)) folderPaths.add(ancestor)
  }

  const items: WorkspaceItem[] = []

  for (const path of folderPaths) {
    items.push({
      kind: 'folder',
      id: path,
      parentId: parentPath(path),
      order: index[path]?.order ?? Number.MAX_SAFE_INTEGER,
      title: baseName(path),
      icon: index[path]?.icon ?? FOLDER_ICON,
      updatedAt: 0,
    })
  }

  for (const file of live) {
    if (!isNotePath(file.path)) continue
    items.push({
      kind: 'note',
      id: file.path,
      parentId: parentPath(file.path),
      order: index[file.path]?.order ?? Number.MAX_SAFE_INTEGER,
      title: baseName(file.path).replace(/\.md$/, ''),
      icon: index[file.path]?.icon ?? DEFAULT_NOTE_ICON,
      updatedAt: file.updatedAt,
      sha: file.sha,
      isDirty: file.isDirty === 1,
    })
  }

  return assignSiblingOrder(items)
}

/**
 * Renumbers each sibling group to be contiguous from 0.
 *
 * Items the index knows about keep their recorded position; anything new (or
 * added on another device) falls in behind them, folders first, then
 * alphabetically — the order Git would have given us anyway.
 */
function assignSiblingOrder(items: WorkspaceItem[]): WorkspaceItem[] {
  const groups = new Map<string, WorkspaceItem[]>()
  for (const item of items) {
    const key = item.parentId ?? ''
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }

  const ordered: WorkspaceItem[] = []
  for (const group of groups.values()) {
    group.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    group.forEach((item, order) => ordered.push({ ...item, order }))
  }

  return ordered
}

/** Files the user should never see in the sidebar. */
export function isPlumbingFile(path: string): boolean {
  return isHiddenPath(path)
}

/**
 * Ids of every item carrying unpushed changes — what the sidebar's dot marks and
 * what enables its Revert action.
 *
 * Changes roll up: a folder is marked when anything beneath it is, so an edit
 * inside a collapsed folder is still visible from the top of the tree. Edits to
 * an item's icon or position live in the sidecar index rather than on the item's
 * own row, so those are compared separately against the last synced index.
 */
export function collectChangedIds(files: LocalFile[]): ReadonlySet<string> {
  const changed = new Set<string>()

  const mark = (path: string, includeSelf: boolean) => {
    if (includeSelf) changed.add(path)
    for (const ancestor of ancestorPaths(path)) changed.add(ancestor)
  }

  for (const file of files) {
    // The index is workspace-wide bookkeeping; which items it marks is worked
    // out below, entry by entry.
    if (file.path === INDEX_FILE) continue
    // A `.gitkeep` is not an item, but the folder holding it is.
    if (hasLocalChanges(file)) mark(file.path, isNotePath(file.path))
  }

  const indexRow = files.find((file) => file.path === INDEX_FILE)
  if (indexRow && indexRow.isDirty === 1) {
    const current = parseNotesIndex(indexRow.content)
    const baseline = indexRow.syncedContent ? parseNotesIndex(indexRow.syncedContent) : {}

    for (const path of new Set([...Object.keys(current), ...Object.keys(baseline)])) {
      if (sameMeta(current[path], baseline[path])) continue
      mark(path, true)
    }
  }

  return changed
}

function sameMeta(a: ItemMeta | undefined, b: ItemMeta | undefined): boolean {
  if (!a || !b) return false
  return a.icon === b.icon && a.order === b.order
}

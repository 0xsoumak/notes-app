import {
  ancestorPaths,
  baseName,
  isHiddenPath,
  isNotePath,
  parentPath,
} from '../paths'
import type { NotesIndex, WorkspaceItem } from '../types'
import type { LocalFile } from './db'
import { DEFAULT_NOTE_ICON } from './notes-index'

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

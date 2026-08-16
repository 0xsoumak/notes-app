import {
  GITKEEP_FILE,
  INDEX_FILE,
  ancestorPaths,
  baseName,
  folderPathFor,
  isDescendantPath,
  joinPath,
  notePathFor,
  parentPath,
  replacePathPrefix,
  uniquePath,
} from '../paths'
import type { ItemPosition, NotesIndex } from '../types'
import { db, type LocalFile } from './db'
import { DEFAULT_NOTE_ICON, parseNotesIndex, serializeNotesIndex } from './notes-index'

const DEFAULT_NOTE_TITLE = 'Untitled'
const DEFAULT_FOLDER_TITLE = 'New folder'

function now(): number {
  return Date.now()
}

function newFile(path: string, content: string): LocalFile {
  return {
    path,
    remotePath: null,
    content,
    sha: null,
    isDirty: 1,
    isDeleted: 0,
    updatedAt: now(),
  }
}

async function takenPaths(): Promise<Set<string>> {
  const files = await db.files.toArray()
  const taken = new Set<string>()
  for (const file of files) {
    if (file.isDeleted === 1) continue
    taken.add(file.path)
    // Folders are implied by paths, so every ancestor name is taken too.
    for (const ancestor of ancestorPaths(file.path)) taken.add(ancestor)
  }
  return taken
}

export async function loadIndex(): Promise<NotesIndex> {
  const row = await db.files.get(INDEX_FILE)
  return row ? parseNotesIndex(row.content) : {}
}

/** Writes the sidecar index and marks it for the next push. */
export async function saveIndex(index: NotesIndex): Promise<void> {
  const existing = await db.files.get(INDEX_FILE)
  await db.files.put({
    ...(existing ?? newFile(INDEX_FILE, '')),
    content: serializeNotesIndex(index),
    isDirty: 1,
    isDeleted: 0,
    updatedAt: now(),
  })
}

async function patchIndex(mutate: (index: NotesIndex) => void): Promise<void> {
  const index = await loadIndex()
  mutate(index)
  await saveIndex(index)
}

/**
 * A folder stops needing its `.gitkeep` the moment it holds a real file.
 * Leaving one behind would be harmless but noisy in the repo.
 */
async function dropGitkeep(folder: string | null): Promise<void> {
  if (!folder) return
  const path = joinPath(folder, GITKEEP_FILE)
  const row = await db.files.get(path)
  if (!row || row.isDeleted === 1) return
  await removePaths([path])
}

export async function createNote(parent: string | null): Promise<string> {
  const taken = await takenPaths()
  const path = uniquePath(notePathFor(parent, DEFAULT_NOTE_TITLE), taken)

  await db.files.put(newFile(path, ''))
  await dropGitkeep(parent)
  await patchIndex((index) => {
    index[path] = { order: Number.MAX_SAFE_INTEGER, icon: DEFAULT_NOTE_ICON }
  })
  return path
}

export async function createFolder(parent: string | null): Promise<string> {
  const taken = await takenPaths()
  const path = uniquePath(folderPathFor(parent, DEFAULT_FOLDER_TITLE), taken)

  // An empty folder only exists in Git if some file anchors it.
  await db.files.put(newFile(joinPath(path, GITKEEP_FILE), ''))
  await dropGitkeep(parent)
  return path
}

export async function writeNoteContent(path: string, content: string): Promise<void> {
  const row = await db.files.get(path)
  if (!row || row.content === content) return
  await db.files.put({ ...row, content, isDirty: 1, updatedAt: now() })
}

export async function setItemIcon(path: string, icon: string): Promise<void> {
  await patchIndex((index) => {
    index[path] = { order: index[path]?.order ?? Number.MAX_SAFE_INTEGER, icon }
  })
}

/**
 * Marks paths as deleted so the next sync removes them from the remote.
 * Files that were never pushed are dropped outright — there is nothing to tell
 * GitHub about.
 */
async function removePaths(paths: string[]): Promise<void> {
  const rows = await db.files.bulkGet(paths)
  const dropped: string[] = []
  const tombstoned: LocalFile[] = []

  for (const row of rows) {
    if (!row) continue
    if (row.remotePath === null) dropped.push(row.path)
    else tombstoned.push({ ...row, isDeleted: 1, isDirty: 1, updatedAt: now() })
  }

  if (dropped.length > 0) await db.files.bulkDelete(dropped)
  if (tombstoned.length > 0) await db.files.bulkPut(tombstoned)
}

/** Deletes a note, or a folder together with everything beneath it. */
export async function deleteItem(path: string): Promise<string[]> {
  const files = await db.files.toArray()
  const targets = files
    .filter(
      (file) => file.isDeleted === 0 && (file.path === path || isDescendantPath(file.path, path)),
    )
    .map((file) => file.path)

  if (targets.length === 0) return []

  await removePaths(targets)
  await patchIndex((index) => {
    for (const key of Object.keys(index)) {
      if (key === path || isDescendantPath(key, path)) delete index[key]
    }
  })

  return targets
}

/**
 * Rewrites a path and every path beneath it. Returns the new path.
 *
 * Rows keep their `remotePath`, which is what lets the sync engine recognise
 * this as a move rather than a delete plus a create.
 */
async function relocate(from: string, to: string): Promise<void> {
  if (from === to) return

  const files = await db.files.toArray()
  const affected = files.filter(
    (file) => file.isDeleted === 0 && (file.path === from || isDescendantPath(file.path, from)),
  )
  if (affected.length === 0) return

  await db.transaction('rw', db.files, async () => {
    await db.files.bulkDelete(affected.map((file) => file.path))
    await db.files.bulkPut(
      affected.map((file) => ({
        ...file,
        path: replacePathPrefix(file.path, from, to),
        isDirty: 1,
        updatedAt: now(),
      })),
    )
  })

  await patchIndex((index) => {
    for (const key of Object.keys(index)) {
      if (key !== from && !isDescendantPath(key, from)) continue
      const moved = replacePathPrefix(key, from, to)
      index[moved] = index[key]
      delete index[key]
    }
  })
}

export async function renameItem(path: string, title: string): Promise<string> {
  const parent = parentPath(path)
  const isNote = path.endsWith('.md')
  const desired = isNote ? notePathFor(parent, title) : folderPathFor(parent, title)
  if (desired === path) return path

  const taken = await takenPaths()
  taken.delete(path)
  const target = uniquePath(desired, taken)

  await relocate(path, target)
  return target
}

/**
 * Applies a drag-and-drop result: reparenting becomes a path move, and the
 * resulting sibling order is recorded in the sidecar index.
 *
 * Returns the dragged item's new path, which differs from its old one whenever
 * it changed folders.
 */
export async function applyPositions(
  activeId: string,
  positions: ItemPosition[],
): Promise<string> {
  const active = positions.find((position) => position.id === activeId)
  let activePath = activeId

  if (active && active.parentId !== parentPath(activeId)) {
    const taken = await takenPaths()
    taken.delete(activeId)
    const desired = joinPath(active.parentId, baseName(activeId))
    activePath = uniquePath(desired, taken)

    await relocate(activeId, activePath)
    await dropGitkeep(active.parentId)
  }

  await patchIndex((index) => {
    for (const position of positions) {
      const key = position.id === activeId ? activePath : position.id
      index[key] = {
        order: position.order,
        icon: index[key]?.icon ?? index[position.id]?.icon ?? DEFAULT_NOTE_ICON,
      }
    }
  })

  return activePath
}

import Dexie, { type EntityTable } from 'dexie'

/**
 * One row per file in the repo, including plumbing files (`.gitkeep`,
 * `.notes-index.json`). Storing those as ordinary rows means the sync engine
 * treats every file identically.
 */
export interface LocalFile {
  /** Repo-relative path. Primary key. */
  path: string
  /**
   * Where this file currently lives on the remote, or `null` if it has never
   * been pushed. When it differs from `path`, the file has been moved or
   * renamed locally and the next sync turns that into a real Git move.
   */
  remotePath: string | null
  /** Markdown body. Empty for `.gitkeep`. */
  content: string
  /** Remote blob SHA, or `null` if never pushed. */
  sha: string | null
  /**
   * Dexie indexes cannot query booleans, so these are 0/1 integers to keep
   * `where('isDirty').equals(1)` available.
   */
  isDirty: 0 | 1
  isDeleted: 0 | 1
  updatedAt: number
}

/** Small key/value store for sync bookkeeping. */
export interface MetaRow {
  key: string
  value: unknown
}

const db = new Dexie('notes-app') as Dexie & {
  files: EntityTable<LocalFile, 'path'>
  meta: EntityTable<MetaRow, 'key'>
}

db.version(1).stores({
  files: 'path, remotePath, isDirty, isDeleted',
  meta: 'key',
})

export { db }

export async function readMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key)
  return row?.value as T | undefined
}

export async function writeMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

/** Wipes local state — used when the repo target changes. */
export async function clearLocalData(): Promise<void> {
  await db.transaction('rw', db.files, db.meta, async () => {
    await db.files.clear()
    await db.meta.clear()
  })
}

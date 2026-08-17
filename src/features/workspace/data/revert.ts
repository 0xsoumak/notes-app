/**
 * Applies revert plans to the database, and puts the sidecar index back in step.
 *
 * The planning itself lives in [`./revert-plan`] and is pure; everything here is
 * the transaction around it.
 */

import { INDEX_FILE, isDescendantPath } from '../paths'
import type { NotesIndex } from '../types'
import { db } from './db'
import { parseNotesIndex, serializeNotesIndex } from './notes-index'
import { filesUnder, hasLocalChanges, planRevert, type RevertPlan } from './revert-plan'
import { markDirtyAgainstBaseline } from './workspace-store'

export interface RevertResult {
  /** How many files were restored or dropped. */
  count: number
  /**
   * Where the reverted item ended up, or `null` if it existed only locally and
   * is now gone. Callers navigating to it need this — undoing a rename moves it.
   */
  restoredPath: string | null
}

/**
 * Reverts one note, or a folder together with everything beneath it.
 *
 * Locally deleted files under a reverted folder come back: they are still on
 * disk as tombstones until a sync clears them, so they are targets like any
 * other. A note deleted on its own leaves no row in the sidebar to revert from
 * — [`revertAll`] is the way back for those.
 */
export async function revertItem(path: string): Promise<RevertResult> {
  return db.transaction('rw', db.files, async () => {
    const files = await db.files.toArray()
    const targetPaths = new Set(
      filesUnder(files, path)
        .filter(hasLocalChanges)
        .map((file) => file.path),
    )

    const plan = planRevert(files, targetPaths, Date.now())
    // An icon or a reordering is recorded only in the sidecar, so an item can
    // have something to revert without any of its own rows being dirty.
    await includeIndexOnlyEdits(plan, path)

    const count = plan.deletes.length + plan.puts.length
    if (count === 0 && plan.moves.size === 0) return { count: 0, restoredPath: path }

    await apply(plan, targetPaths)
    return { count, restoredPath: resolve(plan, path) }
  })
}

/** Discards every local change in the workspace, sidecar index included. */
export async function revertAll(): Promise<number> {
  return db.transaction('rw', db.files, async () => {
    const files = await db.files.toArray()
    const targetPaths = new Set(files.filter(hasLocalChanges).map((file) => file.path))
    if (targetPaths.size === 0) return 0

    const plan = planRevert(files, targetPaths, Date.now())
    await apply(plan, targetPaths)

    return plan.deletes.length + plan.puts.length
  })
}

/**
 * Adds the item's own index keys to the plan as no-op moves, so the index
 * repair below restores their icon and position even when the files themselves
 * had nothing to undo.
 */
async function includeIndexOnlyEdits(plan: RevertPlan, path: string): Promise<void> {
  const row = await db.files.get(INDEX_FILE)
  if (!row) return

  for (const key of Object.keys(parseNotesIndex(row.content))) {
    if (key !== path && !isDescendantPath(key, path)) continue
    if (plan.moves.has(key) || plan.deletes.includes(key)) continue
    plan.moves.set(key, key)
  }
}

/**
 * Where `path` lands after the plan runs.
 *
 * A folder is not a row of its own, so it is located through whichever file
 * beneath it moved: the prefix that file's path gained is the folder's new home.
 */
function resolve(plan: RevertPlan, path: string): string | null {
  const direct = plan.moves.get(path)
  if (direct) return direct
  if (plan.deletes.includes(path)) return null

  for (const [from, to] of plan.moves) {
    if (!isDescendantPath(from, path)) continue
    const suffix = from.slice(path.length)
    if (to.endsWith(suffix)) return to.slice(0, -suffix.length)
  }

  // Nothing beneath it survived, so the folder went with it.
  return plan.moves.size === 0 ? null : path
}

/**
 * Runs the plan, then repairs the sidecar index.
 *
 * Target rows are cleared before the restored ones are written: a revert
 * changes primary keys, and a bare `put` at the new path would leave the old
 * row behind. Doing it in one pass also makes two files swapping paths land
 * correctly.
 */
async function apply(plan: RevertPlan, targetPaths: ReadonlySet<string>): Promise<void> {
  if (targetPaths.size > 0) await db.files.bulkDelete([...targetPaths])
  if (plan.puts.length > 0) await db.files.bulkPut(plan.puts)

  // The index is a file like any other, so a full revert already restored it.
  if (targetPaths.has(INDEX_FILE)) return
  await restoreIndexEntries(plan)
}

/**
 * Moves the reverted items' index entries back to their restored paths and
 * returns their icon and position to the last synced values.
 *
 * Only the affected keys are touched — items outside the revert keep whatever
 * local ordering they have.
 */
async function restoreIndexEntries(plan: RevertPlan): Promise<void> {
  const row = await db.files.get(INDEX_FILE)
  if (!row) return

  const index = parseNotesIndex(row.content)
  const baseline: NotesIndex = row.syncedContent ? parseNotesIndex(row.syncedContent) : {}
  let changed = false

  for (const path of plan.deletes) {
    if (!(path in index)) continue
    delete index[path]
    changed = true
  }

  for (const [from, to] of plan.moves) {
    if (from !== to && from in index) {
      delete index[from]
      changed = true
    }
    const entry = baseline[to]
    if (entry) {
      // Already identical when nothing about this item's placement changed.
      if (index[to]?.icon !== entry.icon || index[to]?.order !== entry.order) changed = true
      index[to] = entry
    } else if (to in index) {
      delete index[to]
      changed = true
    }
  }

  if (!changed) return

  const content = serializeNotesIndex(index)
  await db.files.put(markDirtyAgainstBaseline({ ...row, content, updatedAt: Date.now() }))
}

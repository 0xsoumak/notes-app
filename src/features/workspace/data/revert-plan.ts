/**
 * Works out what reverting a set of files means, without touching the database.
 *
 * Revert is the local half of `git checkout` + `git clean`: every file goes
 * back to the version last seen on the remote, at the path it had there, and
 * files that never existed remotely go away entirely. It deliberately does not
 * fetch — the baseline is already on disk in [`LocalFile.syncedContent`], so
 * reverting works with no network at all.
 */

import { isDescendantPath, uniquePath } from '../paths'
import type { LocalFile } from './db'

export interface RevertPlan {
  /** Rows to drop outright: created locally, never pushed, nothing to restore. */
  deletes: string[]
  /** Rows to write back in their last-synced form. */
  puts: LocalFile[]
  /**
   * `current path → restored path` for everything in `puts`. Undoing a local
   * rename moves a row, and the sidecar index is keyed by path, so callers need
   * the mapping to move its entries back too.
   */
  moves: Map<string, string>
}

/**
 * True when a file differs from the remote in any way the next sync would push:
 * edited, deleted, moved, or never pushed at all.
 */
export function hasLocalChanges(file: LocalFile): boolean {
  return (
    file.isDirty === 1 ||
    file.isDeleted === 1 ||
    file.remotePath === null ||
    file.remotePath !== file.path
  )
}

/** Every file at or beneath `path`, including ones already tombstoned. */
export function filesUnder(files: LocalFile[], path: string): LocalFile[] {
  return files.filter((file) => file.path === path || isDescendantPath(file.path, path))
}

/**
 * Builds the plan for reverting `targets` (a set of current paths) out of the
 * full file list. Files outside the target set are only consulted so a restored
 * path does not land on top of one of them.
 */
export function planRevert(
  files: LocalFile[],
  targets: ReadonlySet<string>,
  now: number,
): RevertPlan {
  const plan: RevertPlan = { deletes: [], puts: [], moves: new Map() }

  // Paths that will still be occupied once the revert lands. A file being
  // reverted vacates its current path, so it is not its own obstacle.
  const occupied = new Set(
    files.filter((file) => file.isDeleted === 0 && !targets.has(file.path)).map((file) => file.path),
  )

  for (const file of files) {
    if (!targets.has(file.path)) continue

    if (file.remotePath === null) {
      plan.deletes.push(file.path)
      continue
    }

    // A rename can be undone into a slot something else has since taken. The
    // file still comes back, one path over; the next sync turns that into an
    // ordinary move rather than clobbering the squatter.
    const restoredPath = uniquePath(file.remotePath, occupied)
    occupied.add(restoredPath)

    // No baseline means the body cannot be restored from disk. Clearing the SHA
    // makes the file look unseen to the pull step, which re-fetches it on the
    // next sync — the one case where revert needs the network to finish.
    // `??` rather than `||`: an empty note is a perfectly good baseline.
    const content = file.syncedContent ?? file.content
    const hasBaseline = file.syncedContent !== null

    plan.puts.push({
      ...file,
      path: restoredPath,
      content,
      syncedContent: file.syncedContent,
      sha: hasBaseline ? file.sha : null,
      isDirty: 0,
      isDeleted: 0,
      updatedAt: now,
      contentRevision:
        content === file.content ? file.contentRevision : file.contentRevision + 1,
    })
    plan.moves.set(file.path, restoredPath)
  }

  return plan
}

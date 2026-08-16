import { db, type LocalFile } from '../data/db'
import { createGitHubClient, type FileMove } from '../github/github-client'
import type { GitHubConfig } from '../github/github-config'
import { GitHubError } from '../github/github-errors'

export interface SyncReport {
  pulled: number
  pushed: number
  moved: number
  deleted: number
  /** Non-fatal problems: one file failed, the rest of the sync went ahead. */
  warnings: string[]
}

function commitMessage(action: string, path: string): string {
  return `${action}(note): ${path}`
}

/**
 * Runs one full sync: pull remote changes, then push local ones.
 *
 * Conflict policy is local-wins — a file with unpushed edits is never
 * overwritten by the pull step, and its push force-retries against the current
 * remote SHA. That suits a single-author notebook; multi-device editing of the
 * same note would need real merging.
 */
export async function runSync(config: GitHubConfig): Promise<SyncReport> {
  const client = createGitHubClient(config)
  const report: SyncReport = { pulled: 0, pushed: 0, moved: 0, deleted: 0, warnings: [] }

  const tree = await client.getTree()
  if (tree.truncated) {
    report.warnings.push('Repository is too large to list in one request; some files were skipped.')
  }

  await pull(client, tree.entries, report)
  await push(client, report)

  return report
}

type Client = ReturnType<typeof createGitHubClient>
type RemoteEntries = Awaited<ReturnType<Client['getTree']>>['entries']

async function pull(client: Client, entries: RemoteEntries, report: SyncReport): Promise<void> {
  const blobs = entries.filter((entry) => entry.type === 'blob')
  const remoteByPath = new Map(blobs.map((entry) => [entry.path, entry]))

  const localFiles = await db.files.toArray()
  // Files are matched on where they live remotely, not where they live locally
  // — a locally moved file must still line up with its remote counterpart.
  const localByRemotePath = new Map(
    localFiles.filter((file) => file.remotePath).map((file) => [file.remotePath!, file]),
  )

  for (const entry of blobs) {
    const local = localByRemotePath.get(entry.path)

    if (local && local.sha === entry.sha) continue
    // Local edits win; the push step will send them upstream.
    if (local && (local.isDirty === 1 || local.isDeleted === 1)) continue

    try {
      const remote = await client.readFile(entry.path)
      await db.files.put({
        path: local?.path ?? entry.path,
        remotePath: entry.path,
        content: remote.content,
        sha: remote.sha,
        isDirty: 0,
        isDeleted: 0,
        updatedAt: Date.now(),
      })
      report.pulled += 1
    } catch (error) {
      report.warnings.push(`Could not read ${entry.path}: ${messageOf(error)}`)
    }
  }

  // Anything we have a remote SHA for that is no longer in the tree was
  // deleted elsewhere. Local edits still win, so dirty rows are left alone.
  const vanished = localFiles.filter(
    (file) =>
      file.remotePath !== null && !remoteByPath.has(file.remotePath) && file.isDirty === 0,
  )
  if (vanished.length > 0) {
    await db.files.bulkDelete(vanished.map((file) => file.path))
  }
}

async function push(client: Client, report: SyncReport): Promise<void> {
  const files = await db.files.toArray()

  await pushDeletes(client, files, report)
  await pushMoves(client, files, report)
  await pushWrites(client, report)
}

async function pushDeletes(
  client: Client,
  files: LocalFile[],
  report: SyncReport,
): Promise<void> {
  const deletions = files.filter((file) => file.isDeleted === 1)

  for (const file of deletions) {
    if (file.remotePath && file.sha) {
      try {
        await client.deleteFile(file.remotePath, file.sha, commitMessage('delete', file.remotePath))
        report.deleted += 1
      } catch (error) {
        if (!(error instanceof GitHubError && error.isNotFound)) {
          report.warnings.push(`Could not delete ${file.remotePath}: ${messageOf(error)}`)
          continue
        }
        // Already gone remotely — dropping the local row is still correct.
      }
    }
    await db.files.delete(file.path)
  }
}

async function pushMoves(client: Client, files: LocalFile[], report: SyncReport): Promise<void> {
  const moved = files.filter(
    (file) => file.isDeleted === 0 && file.remotePath !== null && file.remotePath !== file.path,
  )
  if (moved.length === 0) return

  const moves: FileMove[] = moved.map((file) => ({ from: file.remotePath!, to: file.path }))
  const message =
    moves.length === 1
      ? `move(note): ${moves[0].from} → ${moves[0].to}`
      : `move(note): ${moves.length} files`

  try {
    // One commit for the whole batch, so renaming a folder is not N commits.
    await client.moveFiles(moves, message)
    await db.files.bulkPut(moved.map((file) => ({ ...file, remotePath: file.path })))
    report.moved += moves.length
  } catch (error) {
    report.warnings.push(`Could not move files: ${messageOf(error)}`)
  }
}

async function pushWrites(client: Client, report: SyncReport): Promise<void> {
  // Re-read: the move step above rewrote remotePath on some rows.
  const pending = (await db.files.toArray()).filter(
    (file) => file.isDirty === 1 && file.isDeleted === 0,
  )

  for (const file of pending) {
    try {
      const sha = await writeWithConflictRetry(client, file)
      await db.files.put({ ...file, sha, remotePath: file.path, isDirty: 0 })
      report.pushed += 1
    } catch (error) {
      report.warnings.push(`Could not push ${file.path}: ${messageOf(error)}`)
    }
  }
}

/**
 * Writes a file, retrying once against the current remote SHA if GitHub
 * rejects our stale one. The retry re-asserts the local version, matching the
 * local-wins policy.
 */
async function writeWithConflictRetry(client: Client, file: LocalFile): Promise<string> {
  const message = commitMessage(file.sha ? 'update' : 'create', file.path)

  try {
    return await client.writeFile(file.path, file.content, file.sha, message)
  } catch (error) {
    if (!(error instanceof GitHubError) || !error.isConflict) throw error

    const current = await client.readFile(file.path).catch(() => null)
    return client.writeFile(file.path, file.content, current?.sha ?? null, message)
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

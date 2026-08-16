import { db, type LocalFile } from '../data/db'
import { createGitHubClient, type TreeChange } from '../github/github-client'
import type { GitHubConfig } from '../github/github-config'

export interface SyncReport {
  pulled: number
  pushed: number
  moved: number
  deleted: number
  /** Non-fatal problems: one file failed, the rest of the sync went ahead. */
  warnings: string[]
}

/**
 * A one-line subject when a sync carries a single change, and a summary with
 * the details in the body when it carries several.
 */
function commitMessage(lines: string[]): string {
  if (lines.length === 1) return `sync(note): ${lines[0]}`
  return `sync(notes): ${lines.length} changes\n\n${lines.join('\n')}`
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

/**
 * Sends every pending deletion, move and edit upstream as a single commit.
 *
 * The batch is all-or-nothing: one bad file fails the whole push rather than
 * landing a partial commit. Local rows are only marked clean once the commit
 * is on the branch, so a failed sync leaves everything pending and the next
 * press retries it.
 */
async function push(client: Client, report: SyncReport): Promise<void> {
  const files = await db.files.toArray()

  const deletions = files.filter((file) => file.isDeleted === 1)
  const moves = files.filter(
    (file) => file.isDeleted === 0 && file.remotePath !== null && file.remotePath !== file.path,
  )
  const writes = files.filter((file) => file.isDirty === 1 && file.isDeleted === 0)

  const changes: TreeChange[] = []
  const summary: string[] = []

  for (const file of deletions) {
    // Never pushed, so there is nothing upstream to remove.
    if (!file.remotePath) continue
    changes.push({ kind: 'remove', path: file.remotePath })
    summary.push(`delete ${file.remotePath}`)
  }

  for (const file of moves) {
    changes.push({ kind: 'move', from: file.remotePath!, to: file.path })
    summary.push(`move ${file.remotePath!} → ${file.path}`)
  }

  for (const file of writes) {
    changes.push({ kind: 'write', path: file.path, content: file.content })
    // A moved-and-edited file is already listed as a move; don't count it twice.
    if (!moves.includes(file)) summary.push(`${file.sha ? 'update' : 'create'} ${file.path}`)
  }

  if (changes.length > 0) {
    try {
      const shas = await client.commitChanges(changes, commitMessage(summary))
      await settle(deletions, [...new Set([...moves, ...writes])], shas)
    } catch (error) {
      report.warnings.push(`Could not push changes: ${messageOf(error)}`)
      return
    }
  } else if (deletions.length > 0) {
    // Only ever-local files were deleted, so there is nothing to commit — the
    // rows still have to go.
    await db.files.bulkDelete(deletions.map((file) => file.path))
  }

  report.deleted += deletions.length
  report.moved += moves.length
  report.pushed += writes.length
}

/**
 * Brings local rows in line with the commit that just landed.
 *
 * Rows are re-read inside the transaction and compared against what was
 * actually sent: an edit typed while the request was in flight keeps its dirty
 * flag instead of being marked clean and stranded until the next edit.
 */
async function settle(
  deletions: LocalFile[],
  pushed: LocalFile[],
  shas: Map<string, string> | null,
): Promise<void> {
  await db.transaction('rw', db.files, async () => {
    await db.files.bulkDelete(deletions.map((file) => file.path))
    if (pushed.length === 0) return

    const current = await db.files.bulkGet(pushed.map((file) => file.path))
    const updates: LocalFile[] = []

    for (const [index, sent] of pushed.entries()) {
      const row = current[index]
      if (!row || row.isDeleted === 1) continue

      updates.push({
        ...row,
        remotePath: sent.path,
        // Missing only if the new tree came back truncated; keeping the old SHA
        // costs at most one redundant pull next sync.
        sha: shas?.get(sent.path) ?? row.sha,
        isDirty: row.content === sent.content ? 0 : 1,
      })
    }

    if (updates.length > 0) await db.files.bulkPut(updates)
  })
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

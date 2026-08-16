import { decodeBase64 } from './base64'
import type { GitHubConfig } from './github-config'
import { GitHubError } from './github-errors'

const API_ROOT = 'https://api.github.com'

/** One entry from the recursive tree listing. */
export interface RemoteEntry {
  path: string
  type: 'blob' | 'tree'
  sha: string
  mode: string
}

export interface RemoteTree {
  entries: RemoteEntry[]
  /** GitHub caps the tree response; beyond that the listing is incomplete. */
  truncated: boolean
}

export interface RemoteFile {
  path: string
  content: string
  sha: string
}

/**
 * One change to stage into the next commit. Everything the sync engine wants
 * to push is expressed as these, so a whole sync collapses into one commit.
 */
export type TreeChange =
  | { kind: 'write'; path: string; content: string }
  | { kind: 'remove'; path: string }
  | { kind: 'move'; from: string; to: string }

/** Blob mode for an ordinary non-executable file. */
const FILE_MODE = '100644'

export function createGitHubClient(config: GitHubConfig) {
  const { owner, repo, branch, token } = config
  const repoRoot = `${API_ROOT}/repos/${owner}/${repo}`

  async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

    if (!response.ok) {
      const detail = await response.text()
      let message = `GitHub request failed (${response.status})`
      try {
        const parsed = JSON.parse(detail) as { message?: string }
        if (parsed.message) message = parsed.message
      } catch {
        // Non-JSON error bodies are rare; the status alone will do.
      }
      throw new GitHubError(message, response.status)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

  return {
    /** Cheap credential check — resolves if the token can see the repo. */
    async verifyAccess(): Promise<void> {
      await request<unknown>(`${repoRoot}/branches/${encodeURIComponent(branch)}`)
    },

    /** The whole file listing in one round trip. */
    async getTree(): Promise<RemoteTree> {
      const data = await request<{
        tree: RemoteEntry[]
        truncated: boolean
      }>(`${repoRoot}/git/trees/${encodeURIComponent(branch)}?recursive=1`)

      return { entries: data.tree ?? [], truncated: Boolean(data.truncated) }
    },

    async readFile(path: string): Promise<RemoteFile> {
      const data = await request<{ content: string; sha: string }>(
        `${repoRoot}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
      )
      return { path, content: decodeBase64(data.content), sha: data.sha }
    },

    /**
     * Applies every change as a single commit via the Git Data API.
     *
     * The contents API commits once per call, so pushing edits that way turns
     * one sync into a wall of commits. Building a tree instead keeps a sync of
     * any size to one commit and five requests.
     *
     * Returns the resulting `path → blob sha` map so callers can refresh the
     * SHAs they track, or `null` when there was nothing to commit.
     */
    async commitChanges(
      changes: TreeChange[],
      message: string,
    ): Promise<Map<string, string> | null> {
      if (changes.length === 0) return null

      const ref = await request<{ object: { sha: string } }>(
        `${repoRoot}/git/ref/heads/${encodeURIComponent(branch)}`,
      )
      const headCommitSha = ref.object.sha

      const headCommit = await request<{ tree: { sha: string } }>(
        `${repoRoot}/git/commits/${headCommitSha}`,
      )
      const baseTreeSha = headCommit.tree.sha

      const base = await request<{ tree: RemoteEntry[] }>(
        `${repoRoot}/git/trees/${baseTreeSha}?recursive=1`,
      )
      const blobs = new Map(
        base.tree.filter((entry) => entry.type === 'blob').map((entry) => [entry.path, entry]),
      )

      // Collected per path so a file that was both moved and edited resolves to
      // one entry — the new content at the new path — instead of two that race.
      const additions = new Map<string, Record<string, unknown>>()
      const removals = new Set<string>()

      // Moves first: a write to the same path must win over the copied blob.
      for (const change of changes) {
        if (change.kind !== 'move') continue
        const blob = blobs.get(change.from)
        // Nothing upstream to move; if the file is also dirty its write below
        // creates it at the new path anyway.
        if (!blob) continue
        additions.set(change.to, {
          path: change.to,
          mode: blob.mode,
          type: 'blob',
          sha: blob.sha,
        })
        removals.add(change.from)
      }

      for (const change of changes) {
        if (change.kind === 'write') {
          // Inline `content` lets the tree call create the blob for us, so
          // there is no separate blob request per file.
          additions.set(change.path, {
            path: change.path,
            mode: FILE_MODE,
            type: 'blob',
            content: change.content,
          })
        } else if (change.kind === 'remove') {
          removals.add(change.path)
        }
      }

      const tree = [...additions.values()]
      for (const path of removals) {
        // A path being re-added in this same commit is a move's source only
        // when nothing else put content there.
        if (additions.has(path)) continue
        const blob = blobs.get(path)
        if (!blob) continue
        tree.push({ path, mode: blob.mode, type: 'blob', sha: null })
      }
      if (tree.length === 0) return null

      const newTree = await request<{ sha: string }>(`${repoRoot}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree }),
      })

      const commit = await request<{ sha: string }>(`${repoRoot}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({ message, tree: newTree.sha, parents: [headCommitSha] }),
      })

      // Fast-forward only: if the branch moved under us this fails rather than
      // clobbering the commit we never saw.
      await request<unknown>(`${repoRoot}/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha }),
      })

      const written = await request<{ tree: RemoteEntry[] }>(
        `${repoRoot}/git/trees/${newTree.sha}?recursive=1`,
      )
      return new Map(
        written.tree.filter((entry) => entry.type === 'blob').map((entry) => [entry.path, entry.sha]),
      )
    },
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>

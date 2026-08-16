import { decodeBase64, encodeBase64 } from './base64'
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

export interface FileMove {
  from: string
  to: string
}

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
     * Creates or updates a file. `sha` must be the SHA we last saw for an
     * existing file; omit it when creating.
     */
    async writeFile(
      path: string,
      content: string,
      sha: string | null,
      message: string,
    ): Promise<string> {
      const data = await request<{ content: { sha: string } }>(
        `${repoRoot}/contents/${encodePath(path)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: encodeBase64(content),
            branch,
            ...(sha ? { sha } : {}),
          }),
        },
      )
      return data.content.sha
    },

    async deleteFile(path: string, sha: string, message: string): Promise<void> {
      await request<unknown>(`${repoRoot}/contents/${encodePath(path)}`, {
        method: 'DELETE',
        body: JSON.stringify({ message, sha, branch }),
      })
    },

    /**
     * Moves many files in a single commit via the Git Data API.
     *
     * Renaming a folder with fifty notes inside is one commit and four
     * requests this way, instead of a hundred contents-API calls.
     */
    async moveFiles(moves: FileMove[], message: string): Promise<void> {
      if (moves.length === 0) return

      const ref = await request<{ object: { sha: string } }>(
        `${repoRoot}/git/ref/heads/${encodeURIComponent(branch)}`,
      )
      const headCommitSha = ref.object.sha

      const headCommit = await request<{ tree: { sha: string } }>(
        `${repoRoot}/git/commits/${headCommitSha}`,
      )
      const baseTreeSha = headCommit.tree.sha

      const current = await request<{ tree: RemoteEntry[] }>(
        `${repoRoot}/git/trees/${baseTreeSha}?recursive=1`,
      )
      const blobs = new Map(
        current.tree.filter((entry) => entry.type === 'blob').map((entry) => [entry.path, entry]),
      )

      // `sha: null` removes a path; re-adding the same blob sha at the new
      // path is what makes this a move rather than a copy.
      const changes: Record<string, unknown>[] = []
      for (const move of moves) {
        const blob = blobs.get(move.from)
        if (!blob) continue
        changes.push({ path: move.to, mode: blob.mode, type: 'blob', sha: blob.sha })
        changes.push({ path: move.from, mode: blob.mode, type: 'blob', sha: null })
      }
      if (changes.length === 0) return

      const newTree = await request<{ sha: string }>(`${repoRoot}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: changes }),
      })

      const commit = await request<{ sha: string }>(`${repoRoot}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({ message, tree: newTree.sha, parents: [headCommitSha] }),
      })

      await request<unknown>(`${repoRoot}/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha }),
      })
    },
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>

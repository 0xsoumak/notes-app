const STORAGE_KEYS = {
  token: 'gh_token',
  owner: 'gh_owner',
  repo: 'gh_repo',
  branch: 'gh_branch',
} as const

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

export const DEFAULT_BRANCH = 'main'

/**
 * Credentials live in localStorage, per the client-only design.
 *
 * They are deliberately read through this module rather than inlined at call
 * sites, so moving to OAuth (or a server-held token) later touches one file.
 */
export function readConfig(): GitHubConfig | null {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  const owner = localStorage.getItem(STORAGE_KEYS.owner)
  const repo = localStorage.getItem(STORAGE_KEYS.repo)
  if (!token || !owner || !repo) return null

  return {
    token,
    owner,
    repo,
    branch: localStorage.getItem(STORAGE_KEYS.branch) || DEFAULT_BRANCH,
  }
}

export function writeConfig(config: GitHubConfig): void {
  localStorage.setItem(STORAGE_KEYS.token, config.token.trim())
  localStorage.setItem(STORAGE_KEYS.owner, config.owner.trim())
  localStorage.setItem(STORAGE_KEYS.repo, config.repo.trim())
  localStorage.setItem(STORAGE_KEYS.branch, config.branch.trim() || DEFAULT_BRANCH)
}

export function clearConfig(): void {
  for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key)
}

/** Identifies the repo a local cache belongs to, so switching repos can reset it. */
export function configFingerprint(config: GitHubConfig): string {
  return `${config.owner}/${config.repo}#${config.branch}`
}

const STORAGE_KEYS = {
  token: 'gh_token',
  branch: 'gh_branch',
} as const

/** Keys from when owner/repo were user-editable; cleared on disconnect. */
const LEGACY_STORAGE_KEYS = ['gh_owner', 'gh_repo'] as const

/**
 * The repository is a property of the deployment, not of the person using it,
 * so it is baked in at build time (see `.env.example`) rather than typed into
 * Settings. Only the token and the branch remain configurable.
 */
export const REPO_OWNER = import.meta.env.VITE_GITHUB_OWNER ?? ''
export const REPO_NAME = import.meta.env.VITE_GITHUB_REPO ?? ''

export const BRANCHES = ['main', 'dev'] as const
export type Branch = (typeof BRANCHES)[number]

export const DEFAULT_BRANCH: Branch = 'main'

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: Branch
}

/** True when the build was given a repository to point at. */
export const isRepoConfigured = Boolean(REPO_OWNER && REPO_NAME)

export function buildConfig(token: string, branch: Branch): GitHubConfig {
  return { token: token.trim(), owner: REPO_OWNER, repo: REPO_NAME, branch }
}

function toBranch(value: string | null): Branch {
  return BRANCHES.includes(value as Branch) ? (value as Branch) : DEFAULT_BRANCH
}

/**
 * The token lives in localStorage, per the client-only design.
 *
 * It is deliberately read through this module rather than inlined at call
 * sites, so moving to OAuth (or a server-held token) later touches one file.
 */
export function readConfig(): GitHubConfig | null {
  const token = localStorage.getItem(STORAGE_KEYS.token)
  if (!token || !isRepoConfigured) return null

  return buildConfig(token, toBranch(localStorage.getItem(STORAGE_KEYS.branch)))
}

export function writeConfig(config: GitHubConfig): void {
  localStorage.setItem(STORAGE_KEYS.token, config.token.trim())
  localStorage.setItem(STORAGE_KEYS.branch, config.branch)
}

export function clearConfig(): void {
  for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key)
  for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key)
}

/** Identifies the repo a local cache belongs to, so switching branches can reset it. */
export function configFingerprint(config: GitHubConfig): string {
  return `${config.owner}/${config.repo}#${config.branch}`
}

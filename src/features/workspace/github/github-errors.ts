export class GitHubError extends Error {
  readonly status: number
  readonly path: string | undefined

  constructor(message: string, status: number, path?: string) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
    this.path = path
  }

  /** The remote moved on since we last read it — the caller may retry. */
  get isConflict(): boolean {
    return this.status === 409 || this.status === 422
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isAuthFailure(): boolean {
    return this.status === 401 || this.status === 403
  }
}

/** Turns an API failure into a message worth showing a user. */
export function describeGitHubError(error: unknown): string {
  if (!(error instanceof GitHubError)) {
    return error instanceof Error ? error.message : 'Unexpected error.'
  }
  if (error.isAuthFailure) {
    return 'GitHub rejected the token. Check it has Contents: Read and write on this repo.'
  }
  if (error.isNotFound) {
    return 'Repository or branch not found. Check the owner, repo, and branch in Settings.'
  }
  return error.message
}

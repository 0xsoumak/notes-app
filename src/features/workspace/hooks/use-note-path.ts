import { useParams } from 'react-router'

/**
 * Reads the note path out of the `/notes/*` splat route and decodes it back
 * into a repo path.
 */
export function useNotePath(): string | undefined {
  const params = useParams()
  const splat = params['*']
  if (!splat) return undefined

  return splat
    .split('/')
    .map(decodeURIComponent)
    .filter(Boolean)
    .join('/')
}

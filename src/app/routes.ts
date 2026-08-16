/**
 * Route builders. Kept apart from the route table so component files export
 * only components, which is what fast refresh needs.
 */

/** Builds the route for a note, keeping path segments individually encoded. */
export function noteRoute(path: string): string {
  return `/notes/${path.split('/').map(encodeURIComponent).join('/')}`
}

export const HOME_ROUTE = '/'
export const SETTINGS_ROUTE = '/settings'

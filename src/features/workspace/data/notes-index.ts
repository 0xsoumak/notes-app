import type { NotesIndex } from '../types'

export const DEFAULT_NOTE_ICON = '📄'

/**
 * Parses the sidecar index. Anything malformed is treated as an empty index —
 * order and icons are cosmetic, and losing them must never block loading notes.
 */
export function parseNotesIndex(json: string): NotesIndex {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return {}

    const index: NotesIndex = {}
    for (const [path, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue
      const { order, icon } = value as { order?: unknown; icon?: unknown }
      index[path] = {
        order: typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER,
        icon: typeof icon === 'string' ? icon : DEFAULT_NOTE_ICON,
      }
    }
    return index
  } catch {
    return {}
  }
}

/** Serialized with sorted keys and a trailing newline so diffs stay readable. */
export function serializeNotesIndex(index: NotesIndex): string {
  const sorted: NotesIndex = {}
  for (const path of Object.keys(index).sort()) {
    sorted[path] = index[path]
  }
  return `${JSON.stringify(sorted, null, 2)}\n`
}

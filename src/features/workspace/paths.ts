/**
 * Path helpers. A repo-relative path like `personal/notes/thoughts/today.md`
 * is an item's identity — Git tracks paths, not directories, so the folder
 * hierarchy is implied entirely by these strings.
 */

export const NOTE_EXTENSION = '.md'
/** Anchors an otherwise-empty folder so Git keeps it. */
export const GITKEEP_FILE = '.gitkeep'
/** Sidecar holding sibling order and icons, which Git cannot represent. */
export const INDEX_FILE = '.notes-index.json'

/** Strips leading, trailing, and duplicate slashes. */
export function normalizePath(path: string): string {
  return path
    .split('/')
    .filter((segment) => segment.length > 0)
    .join('/')
}

export function joinPath(...segments: (string | null | undefined)[]): string {
  return normalizePath(segments.filter(Boolean).join('/'))
}

/** `a/b/c` → `a/b`. Root-level paths have no parent. */
export function parentPath(path: string): string | null {
  const normalized = normalizePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? null : normalized.slice(0, index)
}

/** `a/b/c.md` → `c.md` */
export function baseName(path: string): string {
  const normalized = normalizePath(path)
  return normalized.slice(normalized.lastIndexOf('/') + 1)
}

/** `a/b/today.md` → `today` */
export function noteTitle(path: string): string {
  const name = baseName(path)
  return name.endsWith(NOTE_EXTENSION) ? name.slice(0, -NOTE_EXTENSION.length) : name
}

export function isNotePath(path: string): boolean {
  return path.endsWith(NOTE_EXTENSION) && !isHiddenPath(path)
}

/** Dotfiles are plumbing (`.gitkeep`, `.notes-index.json`) and stay out of the UI. */
export function isHiddenPath(path: string): boolean {
  return baseName(path).startsWith('.')
}

/** Path separators plus the characters Windows refuses in a file name. */
const ILLEGAL_SEGMENT_CHARS = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|'])

/** Anything below U+0020 is a control code and has no place in a file name. */
const FIRST_PRINTABLE_CODE_POINT = 0x20

/**
 * Makes a title safe to use as a single path segment. Offending characters are
 * dropped rather than escaped, since the result has to stay readable on GitHub.
 *
 * Spaces and hyphens are deliberately preserved — note titles are full of them
 * ("2026-03-04 standup"), and Git handles both without complaint.
 */
export function sanitizeSegment(title: string): string {
  const cleaned = [...title]
    .filter(
      (character) =>
        !ILLEGAL_SEGMENT_CHARS.has(character) &&
        (character.codePointAt(0) ?? 0) >= FIRST_PRINTABLE_CODE_POINT,
    )
    .join('')
    .replace(/\s+/g, ' ')
    // Leading or trailing dots and spaces make for awkward file names.
    .replace(/^[.\s]+|[.\s]+$/g, '')

  return cleaned || 'untitled'
}

/** Builds the path a note with `title` would occupy inside `parent`. */
export function notePathFor(parent: string | null, title: string): string {
  return joinPath(parent, `${sanitizeSegment(title)}${NOTE_EXTENSION}`)
}

export function folderPathFor(parent: string | null, title: string): string {
  return joinPath(parent, sanitizeSegment(title))
}

/** True when `path` sits anywhere beneath `ancestor`. */
export function isDescendantPath(path: string, ancestor: string): boolean {
  return path.startsWith(`${ancestor}/`)
}

/** Rewrites `path` so a prefix move (`old/x` → `new/x`) applies to a subtree. */
export function replacePathPrefix(path: string, from: string, to: string): string {
  if (path === from) return to
  if (!isDescendantPath(path, from)) return path
  return joinPath(to, path.slice(from.length + 1))
}

/**
 * Appends ` 2`, ` 3`, … until the path is free, so creating or moving an item
 * never silently overwrites an existing file.
 */
export function uniquePath(desired: string, taken: ReadonlySet<string>): string {
  if (!taken.has(desired)) return desired

  const extension = desired.endsWith(NOTE_EXTENSION) ? NOTE_EXTENSION : ''
  const stem = extension ? desired.slice(0, -extension.length) : desired

  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${stem} ${suffix}${extension}`
    if (!taken.has(candidate)) return candidate
  }
}

/** Every ancestor folder of `path`, shallowest first. */
export function ancestorPaths(path: string): string[] {
  const segments = normalizePath(path).split('/')
  segments.pop()

  const ancestors: string[] = []
  for (let index = 0; index < segments.length; index += 1) {
    ancestors.push(segments.slice(0, index + 1).join('/'))
  }
  return ancestors
}

import { describe, expect, it } from 'vitest'
import {
  ancestorPaths,
  baseName,
  isDescendantPath,
  isHiddenPath,
  isNotePath,
  joinPath,
  noteTitle,
  notePathFor,
  normalizePath,
  parentPath,
  replacePathPrefix,
  sanitizeSegment,
  uniquePath,
} from './paths'

describe('normalizePath', () => {
  it('strips leading, trailing, and duplicate slashes', () => {
    expect(normalizePath('/personal/notes/')).toBe('personal/notes')
    expect(normalizePath('personal//notes')).toBe('personal/notes')
    expect(normalizePath('/')).toBe('')
  })
})

describe('path decomposition', () => {
  it('reads parents, names, and titles', () => {
    expect(parentPath('personal/notes/thoughts/today.md')).toBe('personal/notes/thoughts')
    expect(parentPath('today.md')).toBeNull()
    expect(baseName('personal/notes/today.md')).toBe('today.md')
    expect(noteTitle('personal/notes/today.md')).toBe('today')
  })

  it('lists ancestor folders shallowest first', () => {
    expect(ancestorPaths('personal/notes/thoughts/today.md')).toEqual([
      'personal',
      'personal/notes',
      'personal/notes/thoughts',
    ])
    expect(ancestorPaths('today.md')).toEqual([])
  })
})

describe('file classification', () => {
  it('treats dotfiles as plumbing, not notes', () => {
    expect(isNotePath('personal/today.md')).toBe(true)
    expect(isNotePath('personal/.gitkeep')).toBe(false)
    expect(isNotePath('.notes-index.json')).toBe(false)
    expect(isHiddenPath('personal/.gitkeep')).toBe(true)
    expect(isHiddenPath('personal/today.md')).toBe(false)
  })
})

describe('sanitizeSegment', () => {
  it('drops characters that would break a path', () => {
    expect(sanitizeSegment('a/b:c*d?')).toBe('abcd')
    expect(sanitizeSegment('  spaced  out  ')).toBe('spaced out')
  })

  it('keeps spaces and hyphens, which real note titles depend on', () => {
    expect(sanitizeSegment('2026-03-04 standup')).toBe('2026-03-04 standup')
    expect(sanitizeSegment('My Thoughts')).toBe('My Thoughts')
    expect(sanitizeSegment('my-note')).toBe('my-note')
  })

  it('strips control characters', () => {
    // Built from char codes so no raw control bytes end up in this file.
    const withControls = ['a', String.fromCharCode(7), 'b', String.fromCharCode(31), 'c'].join('')
    expect(sanitizeSegment(withControls)).toBe('abc')
  })

  it('never yields an empty segment', () => {
    expect(sanitizeSegment('///')).toBe('untitled')
    expect(sanitizeSegment('...')).toBe('untitled')
  })

  it('builds note paths with the md extension', () => {
    expect(notePathFor('personal/notes', 'Today')).toBe('personal/notes/Today.md')
    expect(notePathFor(null, 'Today')).toBe('Today.md')
  })
})

describe('subtree operations', () => {
  it('recognises descendants but not the path itself', () => {
    expect(isDescendantPath('a/b/c.md', 'a/b')).toBe(true)
    expect(isDescendantPath('a/b', 'a/b')).toBe(false)
    // A sibling with a shared prefix must not count as a descendant.
    expect(isDescendantPath('a/bc.md', 'a/b')).toBe(false)
  })

  it('rewrites a whole subtree when a folder moves', () => {
    expect(replacePathPrefix('personal/notes/today.md', 'personal', 'archive')).toBe(
      'archive/notes/today.md',
    )
    expect(replacePathPrefix('personal', 'personal', 'archive')).toBe('archive')
    expect(replacePathPrefix('other/today.md', 'personal', 'archive')).toBe('other/today.md')
  })
})

describe('uniquePath', () => {
  it('leaves a free path alone', () => {
    expect(uniquePath('notes/today.md', new Set())).toBe('notes/today.md')
  })

  it('suffixes before the extension until the path is free', () => {
    const taken = new Set(['notes/today.md', 'notes/today 2.md'])
    expect(uniquePath('notes/today.md', taken)).toBe('notes/today 3.md')
  })

  it('suffixes folders, which have no extension', () => {
    expect(uniquePath('notes', new Set(['notes']))).toBe('notes 2')
  })
})

describe('joinPath', () => {
  it('ignores null segments so root-level paths work', () => {
    expect(joinPath(null, 'today.md')).toBe('today.md')
    expect(joinPath('a', 'b', 'c.md')).toBe('a/b/c.md')
  })
})

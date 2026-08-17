import { describe, expect, it } from 'vitest'
import type { LocalFile } from './db'
import { filesUnder, hasLocalChanges, planRevert } from './revert-plan'

const NOW = 1_700_000_000_000

/** A clean, previously synced file. Overrides describe the local change. */
function file(path: string, overrides: Partial<LocalFile> = {}): LocalFile {
  return {
    path,
    remotePath: path,
    content: 'remote',
    syncedContent: 'remote',
    sha: 'sha-1',
    isDirty: 0,
    isDeleted: 0,
    updatedAt: 1,
    contentRevision: 0,
    ...overrides,
  }
}

function planFor(files: LocalFile[], paths: string[]) {
  return planRevert(files, new Set(paths), NOW)
}

describe('hasLocalChanges', () => {
  it('is false for a file that matches the remote', () => {
    expect(hasLocalChanges(file('a.md'))).toBe(false)
  })

  it('is true for edits, deletions, moves, and never-pushed files', () => {
    expect(hasLocalChanges(file('a.md', { content: 'edited', isDirty: 1 }))).toBe(true)
    expect(hasLocalChanges(file('a.md', { isDeleted: 1 }))).toBe(true)
    expect(hasLocalChanges(file('b.md', { remotePath: 'a.md' }))).toBe(true)
    expect(hasLocalChanges(file('a.md', { remotePath: null, sha: null }))).toBe(true)
  })
})

describe('filesUnder', () => {
  it('takes the item itself and its whole subtree, tombstones included', () => {
    const files = [
      file('work/a.md'),
      file('work/deep/b.md', { isDeleted: 1 }),
      file('workshop/c.md'),
      file('other.md'),
    ]
    expect(filesUnder(files, 'work').map((entry) => entry.path)).toEqual([
      'work/a.md',
      'work/deep/b.md',
    ])
  })
})

describe('planRevert', () => {
  it('restores an edited file from its baseline and marks it clean', () => {
    const files = [file('a.md', { content: 'edited', isDirty: 1, contentRevision: 3 })]
    const plan = planFor(files, ['a.md'])

    expect(plan.deletes).toEqual([])
    expect(plan.puts).toHaveLength(1)
    expect(plan.puts[0]).toMatchObject({
      path: 'a.md',
      content: 'remote',
      isDirty: 0,
      sha: 'sha-1',
      updatedAt: NOW,
    })
  })

  it('bumps the content revision only when the body actually changes', () => {
    const edited = planFor([file('a.md', { content: 'edited', isDirty: 1 })], ['a.md'])
    expect(edited.puts[0].contentRevision).toBe(1)

    // Moved but never edited: the body is already the baseline, so an open
    // editor has no reason to be torn down and re-seeded.
    const moved = planFor([file('b.md', { remotePath: 'a.md' })], ['b.md'])
    expect(moved.puts[0].contentRevision).toBe(0)
  })

  it('drops files that were never pushed', () => {
    const files = [file('new.md', { remotePath: null, sha: null, syncedContent: null, isDirty: 1 })]
    const plan = planFor(files, ['new.md'])

    expect(plan.deletes).toEqual(['new.md'])
    expect(plan.puts).toEqual([])
    expect(plan.moves.size).toBe(0)
  })

  it('undoes a rename by moving the file back to its remote path', () => {
    const plan = planFor([file('renamed.md', { remotePath: 'original.md' })], ['renamed.md'])

    expect(plan.puts[0].path).toBe('original.md')
    expect(plan.moves.get('renamed.md')).toBe('original.md')
  })

  it('restores a locally deleted file', () => {
    const plan = planFor([file('a.md', { isDeleted: 1, isDirty: 1 })], ['a.md'])

    expect(plan.puts[0]).toMatchObject({ path: 'a.md', isDeleted: 0, isDirty: 0 })
  })

  it('sidesteps a path another file has taken in the meantime', () => {
    const files = [
      file('renamed.md', { remotePath: 'original.md' }),
      // A new note has since claimed the name the rename freed up.
      file('original.md', { remotePath: null, sha: null, syncedContent: null, isDirty: 1 }),
    ]
    const plan = planFor(files, ['renamed.md'])

    expect(plan.puts[0].path).toBe('original 2.md')
  })

  it('reuses the vacated path when the squatter is being reverted too', () => {
    const files = [
      file('renamed.md', { remotePath: 'original.md' }),
      file('original.md', { remotePath: null, sha: null, syncedContent: null, isDirty: 1 }),
    ]
    const plan = planFor(files, ['renamed.md', 'original.md'])

    expect(plan.deletes).toEqual(['original.md'])
    expect(plan.puts[0].path).toBe('original.md')
  })

  it('clears the SHA when no baseline was ever recorded, so the next sync refetches', () => {
    const files = [file('a.md', { content: 'edited', isDirty: 1, syncedContent: null })]
    const plan = planFor(files, ['a.md'])

    expect(plan.puts[0]).toMatchObject({ content: 'edited', sha: null, isDirty: 0 })
  })

  it('leaves files outside the target set alone', () => {
    const files = [file('a.md', { content: 'edited', isDirty: 1 }), file('b.md', { isDirty: 1 })]
    const plan = planFor(files, ['a.md'])

    expect(plan.puts.map((entry) => entry.path)).toEqual(['a.md'])
  })
})

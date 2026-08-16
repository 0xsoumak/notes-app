import { describe, expect, it } from 'vitest'
import { matchScore } from './match'

describe('matchScore', () => {
  it('matches a query spread across the text', () => {
    expect(matchScore('2026-03-04 standup', 'stdup')).not.toBeNull()
    expect(matchScore('New note', 'nn')).not.toBeNull()
  })

  it('rejects a query whose characters are out of order or absent', () => {
    expect(matchScore('New note', 'ne w')).toBeNull()
    expect(matchScore('New note', 'nx')).toBeNull()
  })

  it('matches everything on an empty query without disturbing the caller order', () => {
    expect(matchScore('anything', '')).toEqual({ score: 0, indices: [] })
  })

  it('is case-insensitive', () => {
    expect(matchScore('Release Notes', 'RELEASE')).not.toBeNull()
    expect(matchScore('Release Notes', 'release')).not.toBeNull()
  })

  it('reports where it matched, for highlighting', () => {
    expect(matchScore('standup', 'sup')?.indices).toEqual([0, 5, 6])
  })

  it('ranks a prefix above a match buried mid-word', () => {
    const prefix = matchScore('notes', 'not')?.score ?? 0
    const buried = matchScore('cannot', 'not')?.score ?? 0
    expect(prefix).toBeGreaterThan(buried)
  })

  it('ranks an exact title above one that merely starts with the query', () => {
    const exact = matchScore('standup', 'standup')?.score ?? 0
    const longer = matchScore('standup notes', 'standup')?.score ?? 0
    expect(exact).toBeGreaterThan(longer)
  })

  it('ranks word starts above the same letters mid-word', () => {
    const wordStarts = matchScore('new folder', 'nf')?.score ?? 0
    const midWord = matchScore('nonfiction', 'nf')?.score ?? 0
    expect(wordStarts).toBeGreaterThan(midWord)
  })
})

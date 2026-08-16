import { describe, expect, it } from 'vitest'
import type { FolderItem, NoteItem, WorkspaceItem } from '../types'
import { INDENT_PX } from './constants'
import { getProjection } from './drop-projection'
import { flattenTree, getChildren, getDescendantIds } from './flatten-tree'
import { moveItem } from './move-item'

function folder(id: string, parentId: string | null, order: number): FolderItem {
  return { id, kind: 'folder', parentId, order, title: id, icon: '📁', updatedAt: 0 }
}

function note(id: string, parentId: string | null, order: number): NoteItem {
  return {
    id,
    kind: 'note',
    parentId,
    order,
    title: id,
    icon: '📄',
    updatedAt: 0,
    sha: null,
    isDirty: false,
  }
}

/**
 * root
 *  ├─ work/            (folder)
 *  │   ├─ specs/       (folder)
 *  │   │   └─ api      (note)
 *  │   └─ standup      (note)
 *  ├─ inbox            (note)
 *  └─ scratch          (note)
 */
const items: WorkspaceItem[] = [
  folder('work', null, 0),
  note('inbox', null, 1),
  note('scratch', null, 2),
  folder('specs', 'work', 0),
  note('standup', 'work', 1),
  note('api', 'specs', 0),
]

const allExpanded = new Set(['work', 'specs'])

describe('flattenTree', () => {
  it('lists rows in depth-first order with their depths', () => {
    const flat = flattenTree(items, allExpanded)
    expect(flat.map((node) => [node.id, node.depth])).toEqual([
      ['work', 0],
      ['specs', 1],
      ['api', 2],
      ['standup', 1],
      ['inbox', 0],
      ['scratch', 0],
    ])
  })

  it('hides children of collapsed folders', () => {
    const flat = flattenTree(items, new Set(['work']))
    expect(flat.map((node) => node.id)).toEqual([
      'work',
      'specs',
      'standup',
      'inbox',
      'scratch',
    ])
  })

  it('hides the dragged subtree so a folder cannot be dropped into itself', () => {
    const flat = flattenTree(items, allExpanded, { draggingId: 'work' })
    expect(flat.map((node) => node.id)).toEqual(['work', 'inbox', 'scratch'])
  })

  it('reports children and descendants', () => {
    expect(getChildren(items, 'work').map((item) => item.id)).toEqual(['specs', 'standup'])
    expect(getDescendantIds(items, 'work').sort()).toEqual(['api', 'specs', 'standup'])
  })
})

describe('getProjection', () => {
  const flat = flattenTree(items, allExpanded, { draggingId: 'inbox' })
  // flat is: work(0), specs(1), api(2), standup(1), inbox(0)

  it('keeps depth 0 when dropped at the root with no horizontal drag', () => {
    const projection = getProjection(flat, 'inbox', 'work', 0)
    expect(projection).toMatchObject({ depth: 0, parentId: null })
  })

  it('nests into the folder above when dragged right', () => {
    const projection = getProjection(flat, 'inbox', 'specs', INDENT_PX)
    expect(projection).toMatchObject({ depth: 1, parentId: 'work', previousId: 'work' })
  })

  it('becomes a sibling of the note above it, never that note’s child', () => {
    // The row above this drop is `api`, a note nested in specs/. However far
    // right the drag goes, the deepest legal result is api's own level.
    const projection = getProjection(flat, 'inbox', 'standup', INDENT_PX * 5)
    expect(projection).toMatchObject({ depth: 2, parentId: 'specs', previousId: 'api' })
  })

  it('clamps depth so the following row keeps a valid parent', () => {
    const projection = getProjection(flat, 'inbox', 'specs', -INDENT_PX * 5)
    expect(projection?.depth).toBeGreaterThanOrEqual(0)
  })
})

describe('moveItem', () => {
  it('moves a note into a folder and renumbers both sibling groups', () => {
    const positions = moveItem(items, 'inbox', {
      depth: 1,
      parentId: 'work',
      previousId: 'standup',
    })

    expect(positions).toContainEqual({ id: 'inbox', parentId: 'work', order: 2 })
    // `work` was the only remaining root item, so it keeps order 0 and is not
    // reported as changed.
    expect(positions.find((position) => position.id === 'work')).toBeUndefined()
  })

  it('inserts as the first child when dropped directly onto a folder', () => {
    const positions = moveItem(items, 'inbox', {
      depth: 1,
      parentId: 'work',
      previousId: 'work',
    })

    expect(positions).toContainEqual({ id: 'inbox', parentId: 'work', order: 0 })
    expect(positions).toContainEqual({ id: 'specs', parentId: 'work', order: 1 })
    expect(positions).toContainEqual({ id: 'standup', parentId: 'work', order: 2 })
  })

  it('refuses to move a folder inside its own descendant', () => {
    expect(moveItem(items, 'work', { depth: 2, parentId: 'specs', previousId: 'specs' })).toEqual([])
    expect(moveItem(items, 'work', { depth: 1, parentId: 'work', previousId: 'work' })).toEqual([])
  })

  it('reorders within the root and reports only genuine changes', () => {
    const positions = moveItem(items, 'inbox', { depth: 0, parentId: null, previousId: null })

    expect(positions).toContainEqual({ id: 'inbox', parentId: null, order: 0 })
    expect(positions).toContainEqual({ id: 'work', parentId: null, order: 1 })
  })

  it('anchors to the ancestor sharing the target parent when dropping below a nested row', () => {
    // `api` sits at depth 2 inside specs/. Dropping `scratch` below it at
    // depth 0 should land right after `work`, api's depth-0 ancestor.
    const positions = moveItem(items, 'scratch', { depth: 0, parentId: null, previousId: 'api' })
    expect(positions).toContainEqual({ id: 'scratch', parentId: null, order: 1 })
    expect(positions).toContainEqual({ id: 'inbox', parentId: null, order: 2 })
  })

  it('returns no changes when the drop lands where the item already sits', () => {
    const positions = moveItem(items, 'inbox', { depth: 0, parentId: null, previousId: 'work' })
    expect(positions).toEqual([])
  })
})

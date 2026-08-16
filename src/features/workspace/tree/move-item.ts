import type { ItemPosition, WorkspaceItem } from '../types'
import type { DropTarget } from './drop-projection'
import { getChildren, getDescendantIds } from './flatten-tree'

/**
 * Translates a drop into the minimal set of position changes to persist.
 *
 * Both the departing and arriving sibling groups are renumbered so `order`
 * stays contiguous, and only genuinely changed rows are returned.
 */
export function moveItem(
  items: WorkspaceItem[],
  activeId: string,
  target: DropTarget,
): ItemPosition[] {
  const active = items.find((item) => item.id === activeId)
  if (!active) return []

  const newParentId = target.parentId

  // A folder can't become its own descendant.
  if (newParentId === activeId) return []
  if (newParentId && getDescendantIds(items, activeId).includes(newParentId)) return []

  const siblings = getChildren(items, newParentId).filter((item) => item.id !== activeId)
  const insertAt = resolveInsertIndex(items, siblings, newParentId, target.previousId)
  siblings.splice(insertAt, 0, active)

  const positions: ItemPosition[] = siblings.map((item, order) => ({
    id: item.id,
    parentId: newParentId,
    order,
  }))

  const oldParentId = active.parentId
  if (oldParentId !== newParentId) {
    getChildren(items, oldParentId)
      .filter((item) => item.id !== activeId)
      .forEach((item, order) => positions.push({ id: item.id, parentId: oldParentId, order }))
  }

  const byId = new Map(items.map((item) => [item.id, item]))
  return positions.filter((position) => {
    const current = byId.get(position.id)
    return current?.parentId !== position.parentId || current.order !== position.order
  })
}

/**
 * The dragged row lands directly below `previousId`. That row may be deeper
 * than the target level, so walk up to the ancestor that shares the new parent
 * and insert after it.
 */
function resolveInsertIndex(
  items: WorkspaceItem[],
  siblings: WorkspaceItem[],
  newParentId: string | null,
  previousId: string | null,
): number {
  if (!previousId || previousId === newParentId) return 0

  const byId = new Map(items.map((item) => [item.id, item]))
  let anchor = byId.get(previousId)
  while (anchor && anchor.parentId !== newParentId) {
    anchor = anchor.parentId ? byId.get(anchor.parentId) : undefined
  }
  if (!anchor) return 0

  const index = siblings.findIndex((sibling) => sibling.id === anchor.id)
  return index === -1 ? siblings.length : index + 1
}

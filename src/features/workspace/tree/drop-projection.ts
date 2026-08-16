import { arrayMove } from '@dnd-kit/sortable'
import { isFolder } from '../types'
import { INDENT_PX } from './constants'
import type { FlatNode } from './flatten-tree'

/** Where a drag would land if released right now. */
export interface DropTarget {
  depth: number
  parentId: string | null
  /** The row the dragged item would sit directly beneath, if any. */
  previousId: string | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Resolves the drop position from the row being hovered plus how far the
 * pointer has travelled horizontally — dragging right nests deeper, dragging
 * left moves out toward the root.
 *
 * Depth is clamped so the result is always legal: no deeper than one level
 * below the preceding row, no shallower than the following row, and never
 * nested under a note (only folders take children).
 */
export function getProjection(
  flat: FlatNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
): DropTarget | null {
  const activeIndex = flat.findIndex((node) => node.id === activeId)
  const overIndex = flat.findIndex((node) => node.id === overId)
  if (activeIndex === -1 || overIndex === -1) return null

  const reordered = arrayMove(flat, activeIndex, overIndex)
  const previous = reordered[overIndex - 1] ?? null
  const next = reordered[overIndex + 1] ?? null

  const dragDepth = Math.round(dragOffsetX / INDENT_PX)
  const desiredDepth = flat[activeIndex].depth + dragDepth

  // Only a folder can gain a child, so a note caps depth at its own level.
  const maxDepth = previous ? (isFolder(previous.item) ? previous.depth + 1 : previous.depth) : 0
  const minDepth = next ? next.depth : 0
  const depth = clamp(desiredDepth, minDepth, maxDepth)

  return {
    depth,
    parentId: resolveParentId(reordered, overIndex, previous, depth),
    previousId: previous?.id ?? null,
  }
}

function resolveParentId(
  reordered: FlatNode[],
  overIndex: number,
  previous: FlatNode | null,
  depth: number,
): string | null {
  if (depth === 0 || !previous) return null
  if (depth > previous.depth) return previous.id
  if (depth === previous.depth) return previous.parentId

  // Dropped shallower than the row above: adopt the nearest preceding row
  // that already sits at the target depth.
  for (let index = overIndex - 1; index >= 0; index -= 1) {
    if (reordered[index].depth === depth) return reordered[index].parentId
  }
  return null
}

import { isFolder, type WorkspaceItem } from '../types'

/** One visible row of the tree, with the depth needed to indent it. */
export interface FlatNode {
  id: string
  item: WorkspaceItem
  depth: number
  parentId: string | null
  hasChildren: boolean
  isExpanded: boolean
}

/** Direct children of `parentId`, in sibling order. */
export function getChildren(items: WorkspaceItem[], parentId: string | null): WorkspaceItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}

/** Every id beneath `id`, at any depth. Excludes `id` itself. */
export function getDescendantIds(items: WorkspaceItem[], id: string): string[] {
  const descendants: string[] = []
  const queue = [id]

  while (queue.length > 0) {
    const current = queue.pop()!
    for (const item of items) {
      if (item.parentId !== current) continue
      descendants.push(item.id)
      queue.push(item.id)
    }
  }

  return descendants
}

interface FlattenOptions {
  /**
   * The item being dragged. Its subtree is hidden while dragging so a folder
   * can never be dropped inside itself.
   */
  draggingId?: string | null
}

/**
 * Turns the tree into the flat, ordered list of rows the sidebar renders —
 * which is also the list dnd-kit's sortable context needs.
 */
export function flattenTree(
  items: WorkspaceItem[],
  expandedIds: ReadonlySet<string>,
  { draggingId = null }: FlattenOptions = {},
): FlatNode[] {
  const hidden = draggingId ? new Set(getDescendantIds(items, draggingId)) : new Set<string>()
  const flat: FlatNode[] = []

  const walk = (parentId: string | null, depth: number) => {
    for (const item of getChildren(items, parentId)) {
      if (hidden.has(item.id)) continue

      const hasChildren = isFolder(item) && items.some((child) => child.parentId === item.id)
      // A dragged folder travels collapsed, so its rows don't shift under the cursor.
      const isExpanded = expandedIds.has(item.id) && item.id !== draggingId

      flat.push({ id: item.id, item, depth, parentId, hasChildren, isExpanded })

      if (isExpanded) walk(item.id, depth + 1)
    }
  }

  walk(null, 0)
  return flat
}

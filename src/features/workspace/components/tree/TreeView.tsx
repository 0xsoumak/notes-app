import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import { useWorkspace } from '../../hooks/use-workspace'
import { isDescendantPath, isNotePath, replacePathPrefix } from '../../paths'
import { getProjection, type DropTarget } from '../../tree/drop-projection'
import { flattenTree } from '../../tree/flatten-tree'
import { TreeRow, type TreeRowActions } from './TreeRow'
import { TreeRowGhost } from './TreeRowGhost'

/** Ignore micro-movements so a click still reads as a click, not a drag. */
const DRAG_ACTIVATION_DISTANCE = 4

/**
 * Touch has to distinguish a drag from a scroll, and distance cannot do it —
 * both start as a finger moving. A press-and-hold does, at the cost of a
 * deliberate pause before a row lifts.
 */
const TOUCH_ACTIVATION_DELAY_MS = 220
/** How far the finger may drift during that hold before it counts as a scroll. */
const TOUCH_ACTIVATION_TOLERANCE = 6

interface TreeViewProps {
  activeNoteId: string | undefined
  expandedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  onExpand: (ids: string[]) => void
}

export function TreeView({ activeNoteId, expandedIds, onToggle, onExpand }: TreeViewProps) {
  const {
    items,
    changedIds,
    createNote,
    createFolder,
    renameItem,
    deleteItem,
    revertItem,
    moveItem,
  } = useWorkspace()
  const navigate = useNavigate()

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  // Mouse and touch are split rather than handled by one PointerSensor: a
  // pointer sensor treats a finger like a mouse, so any downward swipe on the
  // tree started a drag and the sidebar could not be scrolled on a phone.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY_MS,
        tolerance: TOUCH_ACTIVATION_TOLERANCE,
      },
    }),
  )

  const flat = useMemo(
    () => flattenTree(items, expandedIds, { draggingId }),
    [items, expandedIds, draggingId],
  )

  const projection: DropTarget | null =
    draggingId && overId ? getProjection(flat, draggingId, overId, offsetX) : null

  const resetDrag = () => {
    setDraggingId(null)
    setOverId(null)
    setOffsetX(0)
  }

  const handleDragEnd = ({ active }: DragEndEvent) => {
    const activeId = String(active.id)
    const target = projection
    resetDrag()
    if (!target) return

    void moveItem(activeId, target).then((nextPath) => {
      // Reveal the destination so the moved row doesn't vanish into a
      // collapsed folder.
      if (target.parentId) onExpand([target.parentId])
      // Moving changes the path, and the path is the URL.
      if (nextPath !== activeId && activeId === activeNoteId && isNotePath(nextPath)) {
        void navigate(noteRoute(nextPath), { replace: true })
      }
    })
  }

  const handleDelete = async (id: string) => {
    const removed = await deleteItem(id)
    if (activeNoteId && removed.includes(activeNoteId)) void navigate('/')
  }

  /**
   * Reverting can move the open note (it undoes renames) or remove it outright
   * (it was only ever local), so the URL has to follow it either way.
   */
  const handleRevert = async (id: string) => {
    const restored = await revertItem(id)
    if (!activeNoteId) return

    const wasOpen = activeNoteId === id || isDescendantPath(activeNoteId, id)
    if (!wasOpen) return

    if (restored === null) {
      void navigate('/')
      return
    }
    const nextPath = activeNoteId === id ? restored : replacePathPrefix(activeNoteId, id, restored)
    // The open note may have been a locally created one dropped by the revert;
    // the note page renders its own "not found" state if so.
    if (nextPath !== activeNoteId) void navigate(noteRoute(nextPath), { replace: true })
  }

  const handleRename = async (id: string, title: string) => {
    const nextPath = await renameItem(id, title)
    if (nextPath !== id && id === activeNoteId && isNotePath(nextPath)) {
      void navigate(noteRoute(nextPath), { replace: true })
    }
  }

  const handleCreateNote = async (parentId: string) => {
    const path = await createNote(parentId)
    onExpand([parentId])
    void navigate(noteRoute(path))
  }

  const handleCreateFolder = async (parentId: string) => {
    await createFolder(parentId)
    onExpand([parentId])
  }

  const actions: TreeRowActions = {
    onToggle,
    onRename: (id, title) => void handleRename(id, title),
    onDelete: (id) => void handleDelete(id),
    onRevert: (id) => void handleRevert(id),
    onCreateNote: (parentId) => void handleCreateNote(parentId),
    onCreateFolder: (parentId) => void handleCreateFolder(parentId),
  }

  const draggingNode = flat.find((node) => node.id === draggingId) ?? null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // Always re-measure: rows appear and disappear as folders collapse.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={({ active }: DragStartEvent) => {
        setDraggingId(String(active.id))
        setOverId(String(active.id))
      }}
      onDragMove={({ delta }: DragMoveEvent) => setOffsetX(delta.x)}
      onDragOver={({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <SortableContext items={flat.map((node) => node.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-px">
          {flat.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              isActive={node.id === activeNoteId}
              isChanged={changedIds.has(node.id)}
              projectedDepth={node.id === draggingId ? projection?.depth : undefined}
              {...actions}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {draggingNode && <TreeRowGhost node={draggingNode} />}
      </DragOverlay>
    </DndContext>
  )
}

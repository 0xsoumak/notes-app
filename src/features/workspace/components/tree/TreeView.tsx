import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
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
import { useWorkspace } from '../../hooks/use-workspace'
import { getProjection, type DropTarget } from '../../tree/drop-projection'
import { flattenTree } from '../../tree/flatten-tree'
import { TreeRow, type TreeRowActions } from './TreeRow'
import { TreeRowGhost } from './TreeRowGhost'

/** Ignore micro-movements so a click still reads as a click, not a drag. */
const DRAG_ACTIVATION_DISTANCE = 4

interface TreeViewProps {
  activeNoteId: string | undefined
  expandedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  onExpand: (ids: string[]) => void
}

export function TreeView({ activeNoteId, expandedIds, onToggle, onExpand }: TreeViewProps) {
  const { items, createNote, createFolder, updateItem, deleteItem, moveItem } = useWorkspace()
  const navigate = useNavigate()

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
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

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggingId(String(active.id))
    setOverId(String(active.id))
  }

  const handleDragMove = ({ delta }: DragMoveEvent) => setOffsetX(delta.x)

  const handleDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)

  const handleDragEnd = ({ active }: DragEndEvent) => {
    if (projection) {
      void moveItem(String(active.id), projection).then(() => {
        // Reveal the destination so the moved row doesn't vanish into a
        // collapsed folder.
        if (projection.parentId) onExpand([projection.parentId])
      })
    }
    resetDrag()
  }

  const handleDelete = async (id: string) => {
    const removedIds = await deleteItem(id)
    if (activeNoteId && removedIds.includes(activeNoteId)) void navigate('/')
  }

  const handleCreateNote = async (parentId: string) => {
    const note = await createNote(parentId)
    onExpand([parentId])
    void navigate(`/notes/${note.id}`)
  }

  const handleCreateFolder = async (parentId: string) => {
    await createFolder(parentId)
    onExpand([parentId])
  }

  const actions: TreeRowActions = {
    onToggle,
    onRename: (id, title) => void updateItem(id, { title }),
    onDelete: (id) => void handleDelete(id),
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
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
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

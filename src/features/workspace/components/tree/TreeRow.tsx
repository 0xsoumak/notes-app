import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import { IconButton } from '@/components/ui/IconButton'
import {
  CaretRightIcon,
  FolderIcon,
  FolderOpenIcon,
  NewFolderIcon,
  NewNoteIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { INDENT_PX } from '../../tree/constants'
import type { FlatNode } from '../../tree/flatten-tree'
import { isFolder } from '../../types'
import { TreeRowLabel } from './TreeRowLabel'

export interface TreeRowActions {
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onCreateNote: (parentId: string) => void
  onCreateFolder: (parentId: string) => void
}

interface TreeRowProps extends TreeRowActions {
  node: FlatNode
  isActive: boolean
  /** Depth the row is projected to land at, while it is being dragged. */
  projectedDepth?: number
}

export function TreeRow({
  node,
  isActive,
  projectedDepth,
  onToggle,
  onRename,
  onDelete,
  onCreateNote,
  onCreateFolder,
}: TreeRowProps) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  })

  const folder = isFolder(node.item)
  const depth = projectedDepth ?? node.depth

  const handleActivate = () => {
    if (folder) {
      onToggle(node.id)
      return
    }
    void navigate(noteRoute(node.id))
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/row relative list-none', isDragging && 'z-10 opacity-40')}
    >
      <div
        style={{ paddingLeft: depth * INDENT_PX + 4 }}
        className={cn(
          // Taller rows on touch, where a 28px target is hard to hit reliably.
          'flex items-center gap-1 rounded-md py-2 pr-1 text-sm transition md:py-1',
          isActive
            ? 'bg-surface-hover text-content font-medium'
            : 'text-content-muted hover:bg-surface-hover hover:text-content',
        )}
        {...attributes}
        {...listeners}
      >
        {folder ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggle(node.id)
            }}
            aria-label={node.isExpanded ? 'Collapse folder' : 'Expand folder'}
            aria-expanded={node.isExpanded}
            className="hover:bg-surface flex size-4 shrink-0 cursor-pointer items-center justify-center rounded"
          >
            <CaretRightIcon
              className={cn('size-3 transition-transform', node.isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}

        {folder ? (
          node.isExpanded ? (
            <FolderOpenIcon className="size-4 shrink-0" weight="fill" />
          ) : (
            <FolderIcon className="size-4 shrink-0" weight="fill" />
          )
        ) : (
          <span aria-hidden="true" className="w-4 shrink-0 text-center text-sm leading-none">
            {node.item.icon}
          </span>
        )}

        <TreeRowLabel
          title={node.item.title}
          onActivate={handleActivate}
          onRename={(title) => onRename(node.id, title)}
        />

        {/* Stop pointerdown here so the row's drag sensor ignores these buttons. */}
        <div
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          // Revealed on hover at desktop widths, but permanently visible below
          // `md`: there is no hover on touch, so these would be unreachable.
          className="flex shrink-0 items-center opacity-100 transition md:opacity-0 md:group-hover/row:opacity-100 md:focus-within:opacity-100"
        >
          {folder && (
            <>
              <IconButton
                label="New note in folder"
                onClick={() => onCreateNote(node.id)}
                className="size-7 md:size-5"
              >
                <NewNoteIcon className="size-3.5" />
              </IconButton>
              <IconButton
                label="New folder inside"
                onClick={() => onCreateFolder(node.id)}
                className="size-7 md:size-5"
              >
                <NewFolderIcon className="size-3.5" />
              </IconButton>
            </>
          )}
          <IconButton label={`Delete ${node.item.title}`} onClick={() => onDelete(node.id)} className="size-7 md:size-5">
            <TrashIcon className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </li>
  )
}

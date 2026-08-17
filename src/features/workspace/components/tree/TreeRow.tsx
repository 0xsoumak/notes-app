import { useRef } from 'react'
import { ContextMenu } from '@base-ui/react/context-menu'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import {
  CaretRightIcon,
  FolderIcon,
  FolderOpenIcon,
  NewFolderIcon,
  NewNoteIcon,
  RenameIcon,
  RevertIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { INDENT_PX } from '../../tree/constants'
import type { FlatNode } from '../../tree/flatten-tree'
import { isFolder } from '../../types'
import { TreeRowLabel, type TreeRowLabelHandle } from './TreeRowLabel'

export interface TreeRowActions {
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onRevert: (id: string) => void
  onCreateNote: (parentId: string) => void
  onCreateFolder: (parentId: string) => void
}

interface TreeRowProps extends TreeRowActions {
  node: FlatNode
  isActive: boolean
  /**
   * Whether this item — or, for a folder, anything inside it — has changes that
   * have not reached the remote yet.
   */
  isChanged: boolean
  /** Depth the row is projected to land at, while it is being dragged. */
  projectedDepth?: number
}

const MENU_ITEM_CLASS = cn(
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 text-sm outline-none',
  'text-content-muted data-highlighted:bg-surface-hover data-highlighted:text-content',
)

export function TreeRow({
  node,
  isActive,
  isChanged,
  projectedDepth,
  onToggle,
  onRename,
  onDelete,
  onRevert,
  onCreateNote,
  onCreateFolder,
}: TreeRowProps) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  })
  const labelRef = useRef<TreeRowLabelHandle>(null)

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
    <ContextMenu.Root>
      {/* `render` puts Base UI's long-press/right-click handling directly on
          the `<li>` dnd-kit already tracks, so no wrapper element is added to
          the list and nothing about drag or layout changes underneath it. */}
      <ContextMenu.Trigger
        render={
          <li
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={cn('group/row relative list-none', isDragging && 'z-10 opacity-40')}
          />
        }
      >
        {/* One guide per level of nesting, aligned with the caret column of the
            ancestor it belongs to, so a deep row can be traced back to its
            folder without counting indents. Drawn per row rather than as one
            tall rule because rows are the only thing that knows its depth —
            and during a drag that depth is the projected one, so the guides
            follow the row as it changes level. */}
        {Array.from({ length: depth }, (_, level) => (
          <span
            key={level}
            aria-hidden="true"
            className="bg-border-subtle pointer-events-none absolute top-0 -bottom-px w-px"
            style={{ left: (level + 1) * INDENT_PX - 4 }}
          />
        ))}

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
            ref={labelRef}
            title={node.item.title}
            onActivate={handleActivate}
            onRename={(title) => onRename(node.id, title)}
          />

          {isChanged && (
            // Marks work that has not reached GitHub yet. A folder inherits the
            // dot from its contents, so a change inside a collapsed folder is
            // still visible from the top of the tree.
            <span
              role="img"
              aria-label="Unsynced changes"
              title="Unsynced changes"
              className="bg-content-muted/60 group-hover/row:bg-content-muted mr-1 size-1.5 shrink-0 rounded-full"
            />
          )}
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Positioner sideOffset={4} align="start">
          <ContextMenu.Popup className="bg-surface border-border-subtle z-50 min-w-40 rounded-xl border p-1 shadow-lg shadow-black/20 outline-none">
            {folder && (
              <>
                <ContextMenu.Item className={MENU_ITEM_CLASS} onClick={() => onCreateNote(node.id)}>
                  <NewNoteIcon className="size-4" />
                  New note
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={MENU_ITEM_CLASS}
                  onClick={() => onCreateFolder(node.id)}
                >
                  <NewFolderIcon className="size-4" />
                  New folder
                </ContextMenu.Item>
                <ContextMenu.Separator className="bg-border-subtle my-1 h-px" />
              </>
            )}
            <ContextMenu.Item
              className={MENU_ITEM_CLASS}
              onClick={() => labelRef.current?.startEditing()}
            >
              <RenameIcon className="size-4" />
              Rename
            </ContextMenu.Item>
            {isChanged && (
              <ContextMenu.Item className={MENU_ITEM_CLASS} onClick={() => onRevert(node.id)}>
                <RevertIcon className="size-4" />
                {folder ? 'Revert folder' : 'Revert changes'}
              </ContextMenu.Item>
            )}
            <ContextMenu.Item
              className={cn(MENU_ITEM_CLASS, 'data-highlighted:text-red-600')}
              onClick={() => onDelete(node.id)}
            >
              <TrashIcon className="size-4" />
              Delete
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

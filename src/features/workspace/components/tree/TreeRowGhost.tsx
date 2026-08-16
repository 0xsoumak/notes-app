import { FolderIcon } from '@/components/ui/icons'
import type { FlatNode } from '../../tree/flatten-tree'
import { isFolder } from '../../types'

interface TreeRowGhostProps {
  node: FlatNode
}

/** The row that follows the cursor during a drag. */
export function TreeRowGhost({ node }: TreeRowGhostProps) {
  const folder = isFolder(node.item)

  return (
    <div className="bg-surface border-border-subtle text-content flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm shadow-lg">
      {folder ? (
        <FolderIcon className="size-4 shrink-0" weight="fill" />
      ) : (
        <span aria-hidden="true" className="w-4 shrink-0 text-center text-sm leading-none">
          {node.item.icon}
        </span>
      )}
      <span className="max-w-48 truncate">{node.item.title || 'Untitled'}</span>
    </div>
  )
}

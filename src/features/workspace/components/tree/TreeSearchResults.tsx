import { NavLink } from 'react-router'
import { noteRoute } from '@/app/routes'
import { FolderIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { isFolder, type WorkspaceItem } from '../../types'

interface TreeSearchResultsProps {
  matches: WorkspaceItem[]
}

/**
 * A flat result list shown while searching. Deliberately not drag-and-drop —
 * reordering only makes sense against the real tree.
 */
export function TreeSearchResults({ matches }: TreeSearchResultsProps) {
  if (matches.length === 0) {
    return <p className="text-content-muted px-2 py-6 text-center text-xs">No matches.</p>
  }

  return (
    <ul className="space-y-px">
      {matches.map((item) =>
        isFolder(item) ? (
          <li
            key={item.id}
            className="text-content-muted flex items-center gap-1.5 rounded-md px-2 py-1 text-sm"
          >
            <FolderIcon className="size-4 shrink-0" weight="fill" />
            <span className="truncate">{item.title}</span>
          </li>
        ) : (
          <li key={item.id}>
            <NavLink
              to={noteRoute(item.id)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition',
                  isActive
                    ? 'bg-surface-hover text-content font-medium'
                    : 'text-content-muted hover:bg-surface-hover hover:text-content',
                )
              }
            >
              <span aria-hidden="true" className="w-4 shrink-0 text-center leading-none">
                {item.icon}
              </span>
              <span className="truncate">{item.title || 'Untitled'}</span>
            </NavLink>
          </li>
        ),
      )}
    </ul>
  )
}

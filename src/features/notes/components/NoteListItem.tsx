import { NavLink } from 'react-router'
import { TrashIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-date'
import type { Note } from '../types'

interface NoteListItemProps {
  note: Note
  onDelete: (id: string) => void
}

export function NoteListItem({ note, onDelete }: NoteListItemProps) {
  return (
    <li className="group/item relative">
      <NavLink
        to={`/notes/${note.id}`}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm transition',
            isActive
              ? 'bg-surface-hover text-content font-medium'
              : 'text-content-muted hover:bg-surface-hover hover:text-content',
          )
        }
      >
        <span aria-hidden="true" className="text-base leading-none">
          {note.icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{note.title || 'Untitled'}</span>
        <span className="text-content-muted shrink-0 text-[11px] opacity-0 transition group-hover/item:opacity-100">
          {formatRelativeTime(note.updatedAt)}
        </span>
      </NavLink>

      <button
        type="button"
        onClick={() => onDelete(note.id)}
        aria-label={`Delete ${note.title || 'Untitled'}`}
        className={cn(
          'text-content-muted absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded p-1',
          'opacity-0 transition group-hover/item:opacity-100',
          'hover:bg-surface hover:text-content focus-visible:opacity-100',
        )}
      >
        <TrashIcon className="size-3.5" />
      </button>
    </li>
  )
}

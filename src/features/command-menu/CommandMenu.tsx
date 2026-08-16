import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Dialog } from '@base-ui/react/dialog'
import { useNavigate } from 'react-router'
import { noteRoute } from '@/app/routes'
import { NewNoteIcon, SearchIcon } from '@/components/ui/icons'
import { isNote, useWorkspace } from '@/features/workspace'
import { cn } from '@/lib/cn'
import { matchScore } from './match'
import { useCommandActions } from './use-command-actions'

/** Notes shown before anything is typed — the most recently touched ones. */
const RECENT_NOTE_LIMIT = 6
/** Cap on matched notes, so a one-letter query cannot render the whole repo. */
const MATCHED_NOTE_LIMIT = 20

interface Row {
  key: string
  icon: ComponentType<{ className?: string }> | null
  /** Rendered when there is no icon component — a note's emoji. */
  glyph?: string
  label: string
  sublabel?: string
  hint?: string
  /** Positions within `label` that matched the query. */
  indices: number[]
  run: () => void
}

/** The shape Base UI expects for a grouped list: a label and its items. */
interface RowGroup {
  value: string
  items: Row[]
}

/**
 * The folder a note lives in, shown beside its title so two notes with the
 * same name stay tellable apart. Empty at the repo root.
 */
function folderOf(path: string): string | undefined {
  const cut = path.lastIndexOf('/')
  return cut === -1 ? undefined : path.slice(0, cut)
}

/** Bolds the characters the query matched, leaving the rest as typed. */
function Highlighted({ text, indices }: { text: string; indices: number[] }): ReactNode {
  if (indices.length === 0) return text

  // The character's position *is* its identity here, so the index is a
  // legitimate key: this list never reorders, it is rebuilt per query.
  const marked = new Set(indices)
  return [...text].map((character, index) =>
    marked.has(index) ? (
      <span key={index} className="text-content font-semibold">
        {character}
      </span>
    ) : (
      <span key={index}>{character}</span>
    ),
  )
}

interface CommandMenuProps {
  onClose: () => void
}

/**
 * The command palette: one search field over both the note list and the app's
 * own actions, in the shape Linear and Raycast established.
 *
 * Built on Base UI's `Autocomplete` in `inline` mode inside a `Dialog` — the
 * combination the library documents for this pattern. Filtering is ours
 * (`mode="none"` leaves the item list alone) because the ranking has to span
 * two different kinds of row; everything about focus, dismissal, scroll lock
 * and listbox keyboard semantics is the library's.
 *
 * Mounted only while open, so the query and the highlight reset between
 * openings rather than needing to be cleared.
 */
export function CommandMenu({ onClose }: CommandMenuProps) {
  const [query, setQuery] = useState('')
  const { items, createNote, renameItem } = useWorkspace()
  const actions = useCommandActions()
  const navigate = useNavigate()

  const trimmedQuery = query.trim()

  const groups = useMemo<RowGroup[]>(() => {
    const actionRows: Row[] = actions
      .map((action) => {
        const match = matchScore(action.title, trimmedQuery)
        // Keywords widen what finds an action ("push" → Sync now) without
        // putting those words on screen, so they never win the highlight.
        const keywordMatch = match ? null : matchScore(action.keywords ?? '', trimmedQuery)
        if (!match && !keywordMatch) return null

        return {
          row: {
            key: `action:${action.id}`,
            icon: action.icon,
            label: action.title,
            hint: action.hint,
            indices: match?.indices ?? [],
            run: () => void action.run(),
          } satisfies Row,
          score: match?.score ?? (keywordMatch?.score ?? 0) - 1,
        }
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.row)

    // Typing a title nobody has used yet is a create, not a failed search.
    if (trimmedQuery) {
      actionRows.push({
        key: 'action:create-titled',
        icon: NewNoteIcon,
        label: `Create note “${trimmedQuery}”`,
        indices: [],
        run: () => {
          void (async () => {
            const path = await createNote(null)
            void navigate(noteRoute(await renameItem(path, trimmedQuery)))
          })()
        },
      })
    }

    const noteRows = items
      .filter(isNote)
      .map((item) => {
        const title = item.title || 'Untitled'
        const match = matchScore(title, trimmedQuery)
        // Falling back to the full path lets a folder name find its notes.
        // No highlight then — the matched characters are not in the title.
        const pathMatch = match ? null : matchScore(item.id, trimmedQuery)
        if (!match && !pathMatch) return null

        return {
          row: {
            key: `note:${item.id}`,
            icon: null,
            glyph: item.icon,
            label: title,
            sublabel: folderOf(item.id),
            indices: match?.indices ?? [],
            run: () => void navigate(noteRoute(item.id)),
          } satisfies Row,
          // With nothing typed every note scores 0, so recency decides.
          score: match?.score ?? (pathMatch?.score ?? 0) - 1,
          updatedAt: item.updatedAt,
        }
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
      .slice(0, trimmedQuery ? MATCHED_NOTE_LIMIT : RECENT_NOTE_LIMIT)
      .map((entry) => entry.row)

    return [
      { value: 'Actions', items: actionRows },
      { value: trimmedQuery ? 'Notes' : 'Recent', items: noteRows },
      // An empty group would render as a bare heading.
    ].filter((group) => group.items.length > 0)
  }, [actions, createNote, items, navigate, renameItem, trimmedQuery])

  const select = (row: Row) => {
    row.run()
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />

        <Dialog.Popup
          className={cn(
            'bg-surface border-border-subtle fixed z-50 flex flex-col overflow-hidden',
            'top-[10vh] left-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 sm:top-[15vh]',
            'max-h-[70vh] rounded-xl border shadow-2xl shadow-black/25',
          )}
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>

          <Autocomplete.Root
            // `inline` renders the list in place instead of in a popup of its
            // own, and `open` keeps it visible: inside a dialog there is
            // nothing to pop over. `mode="none"` hands filtering to us.
            inline
            open
            mode="none"
            items={groups}
            value={query}
            onValueChange={setQuery}
            autoHighlight="always"
            keepHighlight
            itemToStringValue={(row: Row) => row.label}
          >
            <div className="border-border-subtle flex items-center gap-2 border-b px-3 py-3">
              <SearchIcon className="text-content-muted size-4 shrink-0" />
              <Autocomplete.Input
                placeholder="Search notes or run a command…"
                aria-label="Search notes or run a command"
                className="text-content placeholder:text-content-muted/70 w-full bg-transparent text-sm outline-none"
              />
            </div>

            {/* Rendered only when there is nothing to show: the part keeps
                its box — and so its padding — even while hidden, which reads
                as a gap under the search field. */}
            {groups.length === 0 && (
              <Autocomplete.Empty className="text-content-muted px-2 py-8 text-center text-xs">
                No matches.
              </Autocomplete.Empty>
            )}

            <Autocomplete.List className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {(group: RowGroup) => (
                <Autocomplete.Group key={group.value} items={group.items}>
                  <Autocomplete.GroupLabel className="text-content-muted/80 px-2 pt-2 pb-1 text-[11px] font-medium">
                    {group.value}
                  </Autocomplete.GroupLabel>

                  <Autocomplete.Collection>
                    {(row: Row) => {
                      const Icon = row.icon

                      return (
                        <Autocomplete.Item
                          key={row.key}
                          value={row}
                          onClick={() => select(row)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm',
                            'text-content-muted transition-colors outline-none',
                            'data-highlighted:bg-surface-hover data-highlighted:text-content',
                          )}
                        >
                          {Icon ? (
                            <Icon className="size-4 shrink-0" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="w-4 shrink-0 text-center leading-none"
                            >
                              {row.glyph}
                            </span>
                          )}

                          <span className="min-w-0 flex-1 truncate">
                            <Highlighted text={row.label} indices={row.indices} />
                          </span>

                          {row.sublabel && (
                            <span className="text-content-muted/70 max-w-[40%] shrink-0 truncate text-xs">
                              {row.sublabel}
                            </span>
                          )}
                          {row.hint && (
                            <span className="text-content-muted/70 shrink-0 text-xs">
                              {row.hint}
                            </span>
                          )}
                        </Autocomplete.Item>
                      )
                    }}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Root>

          <div className="border-border-subtle text-content-muted/70 hidden items-center gap-4 border-t px-3 py-2 text-[11px] sm:flex">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

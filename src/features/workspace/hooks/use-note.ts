import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'
import { db } from '../data/db'
import { writeNoteContent } from '../data/workspace-store'
import { isNotePath } from '../paths'
import { isNote } from '../types'
import { useWorkspace } from './use-workspace'

/** How long editing pauses before a note is written to IndexedDB. */
const SAVE_DEBOUNCE_MS = 600

/**
 * Reads a single note by path and exposes a debounced writer for it.
 *
 * The path travels with each debounced call, so a pending save always lands on
 * the note it was typed into — even if the user navigates away first.
 */
export function useNote(path: string | undefined) {
  const { items } = useWorkspace()

  // Normalised to `null` for "no such note", so `undefined` means only one
  // thing: the query has not resolved yet.
  const file = useLiveQuery(
    async () => (path && isNotePath(path) ? ((await db.files.get(path)) ?? null) : null),
    [path],
  )

  const item = items.find((candidate) => candidate.id === path)
  const note = item && isNote(item) ? item : null

  const { run, flush } = useDebouncedCallback(
    (target: string, markdown: string) => void writeNoteContent(target, markdown),
    SAVE_DEBOUNCE_MS,
  )

  // Switching notes commits whatever was still pending on the previous one.
  useEffect(() => flush, [path, flush])

  const saveContent = useCallback(
    (markdown: string) => {
      if (path) run(path, markdown)
    },
    [path, run],
  )

  return {
    note,
    /** Markdown body, or `undefined` while the lookup is in flight. */
    content: file?.content,
    isLoading: file === undefined,
    isMissing: file === null,
    saveContent,
  }
}

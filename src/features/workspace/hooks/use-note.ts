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

  // `useLiveQuery` keeps serving the previous result while a re-run triggered by
  // a new `path` is in flight, so the result is tagged with the path it was read
  // for. Without that tag the hook would briefly report the *previous* note's
  // body under the new path, and the editor — which seeds itself once on mount —
  // would hydrate from it and never correct itself.
  const result = useLiveQuery(
    async () => ({
      path,
      file: path && isNotePath(path) ? ((await db.files.get(path)) ?? null) : null,
    }),
    [path],
  )

  // Normalised to `null` for "no such note", so `undefined` means only one
  // thing: no resolved read for the current path yet.
  const file = result && result.path === path ? result.file : undefined

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
    /**
     * Changes only when the body was replaced from outside the editor — a
     * revert or a pull. The editor seeds itself once per mount, so callers key
     * it on this to make it re-read; typing does not move it, so an ordinary
     * edit never remounts the editor out from under the cursor.
     */
    contentRevision: file?.contentRevision ?? 0,
    isLoading: file === undefined,
    isMissing: file === null,
    saveContent,
  }
}

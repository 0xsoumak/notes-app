import { useCallback, useEffect } from 'react'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'
import { isNote, type ItemPatch } from '../types'
import { useWorkspace } from './use-workspace'

/** How long editing pauses before a note is persisted. */
const SAVE_DEBOUNCE_MS = 600

/**
 * Reads a single note and exposes a debounced writer for it.
 *
 * The note id travels with each debounced call, so a pending save always lands
 * on the note it was typed into — even if the user navigates away first.
 */
export function useNote(noteId: string | undefined) {
  const { items, status, updateItem } = useWorkspace()

  const item = noteId ? items.find((candidate) => candidate.id === noteId) : undefined
  const note = item && isNote(item) ? item : null

  const { run, flush } = useDebouncedCallback(
    (id: string, patch: ItemPatch) => void updateItem(id, patch),
    SAVE_DEBOUNCE_MS,
  )

  // Switching notes commits whatever was still pending on the previous one.
  useEffect(() => flush, [noteId, flush])

  const saveNote = useCallback(
    (patch: ItemPatch) => {
      if (noteId) run(noteId, patch)
    },
    [noteId, run],
  )

  return {
    note,
    isLoading: status === 'loading',
    isMissing: status === 'ready' && Boolean(noteId) && note === null,
    saveNote,
  }
}

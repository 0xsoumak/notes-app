import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { notesRepository } from '../api'
import type { NotePatch } from '../types'
import { NotesContext, type NotesContextValue } from './notes-context'
import { initialNotesState, notesReducer, sortByRecency } from './notes-reducer'

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState)

  useEffect(() => {
    let cancelled = false

    notesRepository
      .list()
      .then((notes) => {
        if (!cancelled) dispatch({ type: 'loaded', notes })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          dispatch({ type: 'failed', error: toMessage(error) })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const createNote = useCallback(async () => {
    const note = await notesRepository.create()
    dispatch({ type: 'upserted', note })
    return note
  }, [])

  const updateNote = useCallback(async (id: string, patch: NotePatch) => {
    const note = await notesRepository.update(id, patch)
    dispatch({ type: 'upserted', note })
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    await notesRepository.remove(id)
    dispatch({ type: 'removed', id })
  }, [])

  const value = useMemo<NotesContextValue>(
    () => ({
      notes: sortByRecency(state.notes),
      status: state.status,
      error: state.error,
      createNote,
      updateNote,
      deleteNote,
    }),
    [state, createNote, updateNote, deleteNote],
  )

  return <NotesContext value={value}>{children}</NotesContext>
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong loading your notes.'
}

import { createContext, use } from 'react'
import type { Note, NotePatch } from '../types'
import type { NotesStatus } from './notes-reducer'

export interface NotesContextValue {
  /** All notes, most recently edited first. */
  notes: Note[]
  status: NotesStatus
  error: string | null
  createNote: () => Promise<Note>
  updateNote: (id: string, patch: NotePatch) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const NotesContext = createContext<NotesContextValue | null>(null)

export function useNotesContext(): NotesContextValue {
  const context = use(NotesContext)
  if (!context) {
    throw new Error('useNotesContext must be used within a <NotesProvider>')
  }
  return context
}

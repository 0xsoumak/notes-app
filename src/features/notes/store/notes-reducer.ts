import type { Note } from '../types'

export type NotesStatus = 'loading' | 'ready' | 'error'

export interface NotesState {
  notes: Note[]
  status: NotesStatus
  error: string | null
}

export type NotesAction =
  | { type: 'loaded'; notes: Note[] }
  | { type: 'failed'; error: string }
  | { type: 'upserted'; note: Note }
  | { type: 'removed'; id: string }

export const initialNotesState: NotesState = {
  notes: [],
  status: 'loading',
  error: null,
}

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'loaded':
      return { notes: action.notes, status: 'ready', error: null }

    case 'failed':
      return { ...state, status: 'error', error: action.error }

    case 'upserted': {
      const exists = state.notes.some((note) => note.id === action.note.id)
      return {
        ...state,
        notes: exists
          ? state.notes.map((note) => (note.id === action.note.id ? action.note : note))
          : [action.note, ...state.notes],
      }
    }

    case 'removed':
      return { ...state, notes: state.notes.filter((note) => note.id !== action.id) }
  }
}

/** Most recently edited first — the order the sidebar renders. */
export function sortByRecency(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

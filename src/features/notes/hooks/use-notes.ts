import { useNotesContext } from '../store/notes-context'

/** The full note collection plus the mutations that act on it. */
export function useNotes() {
  return useNotesContext()
}

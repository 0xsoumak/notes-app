/** Public surface of the notes feature — import from here, not from subpaths. */
export { NoteEditor } from './components/NoteEditor'
export { NoteList } from './components/NoteList'
export { useNote } from './hooks/use-note'
export { useNotes } from './hooks/use-notes'
export { NotesProvider } from './store/NotesProvider'
export type { Note, NoteContent, NotePatch } from './types'

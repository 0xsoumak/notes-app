import { createLocalNotesRepository } from './local-notes-repository'
import type { NotesRepository } from './notes-repository'

/**
 * The single place the app decides where notes come from. When the backend
 * lands, replace this with `createHttpNotesRepository(...)`.
 */
export const notesRepository: NotesRepository = createLocalNotesRepository()

export { DEFAULT_NOTE_ICON, DEFAULT_NOTE_TITLE } from './local-notes-repository'
export type { NotesRepository } from './notes-repository'

import type { Note, NotePatch } from '../types'

/**
 * The seam between the UI and wherever notes actually live.
 *
 * Every method is async even though today's implementation is synchronous
 * localStorage — that way swapping in an HTTP client requires no changes above
 * this layer.
 */
export interface NotesRepository {
  list(): Promise<Note[]>
  get(id: string): Promise<Note | null>
  create(patch?: NotePatch): Promise<Note>
  update(id: string, patch: NotePatch): Promise<Note>
  remove(id: string): Promise<void>
}

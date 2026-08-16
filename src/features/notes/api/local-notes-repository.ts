import { createId } from '@/lib/id'
import type { Note } from '../types'
import type { NotesRepository } from './notes-repository'

const STORAGE_KEY = 'notes-app:notes'

export const DEFAULT_NOTE_TITLE = 'Untitled'
export const DEFAULT_NOTE_ICON = '📄'

function readAll(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Note[]) : []
  } catch {
    // Corrupt or unavailable storage shouldn't take the app down.
    return []
  }
}

function writeAll(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Quota or private-mode failures are non-fatal for the UI phase.
  }
}

/**
 * localStorage-backed notes, used while the UI is built ahead of the backend.
 */
export function createLocalNotesRepository(): NotesRepository {
  return {
    async list() {
      return readAll()
    },

    async get(id) {
      return readAll().find((note) => note.id === id) ?? null
    },

    async create(patch = {}) {
      const now = new Date().toISOString()
      const note: Note = {
        id: createId(),
        title: patch.title ?? DEFAULT_NOTE_TITLE,
        icon: patch.icon ?? DEFAULT_NOTE_ICON,
        content: patch.content ?? [],
        createdAt: now,
        updatedAt: now,
      }

      writeAll([note, ...readAll()])
      return note
    },

    async update(id, patch) {
      const notes = readAll()
      const index = notes.findIndex((note) => note.id === id)
      if (index === -1) throw new Error(`Note not found: ${id}`)

      const updated: Note = {
        ...notes[index],
        ...patch,
        updatedAt: new Date().toISOString(),
      }

      notes[index] = updated
      writeAll(notes)
      return updated
    },

    async remove(id) {
      writeAll(readAll().filter((note) => note.id !== id))
    },
  }
}

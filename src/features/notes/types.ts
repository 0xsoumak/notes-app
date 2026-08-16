import type { Block } from '@blocknote/core'

/** A note's body is BlockNote's document model — an array of blocks. */
export type NoteContent = Block[]

export interface Note {
  id: string
  title: string
  /** Emoji shown beside the title, Notion-style. */
  icon: string
  content: NoteContent
  createdAt: string
  updatedAt: string
}

/** The fields a user can edit. Everything else is owned by the data layer. */
export type NotePatch = Partial<Pick<Note, 'title' | 'icon' | 'content'>>

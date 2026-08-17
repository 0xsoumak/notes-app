import { Extension, type Editor, type Range } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion'
import type { ReactNode } from 'react'

/** One row of the suggestion popup. */
export interface SuggestionItem {
  id: string
  label: string
  /** Extra words the query is matched against — never shown. */
  keywords?: string[]
  /** Leading glyph: an icon for commands, the character itself for emoji. */
  glyph: ReactNode
  hint?: string
  /** Applied when the row is chosen. `range` covers the trigger and query. */
  run: (editor: Editor, range: Range) => void
}

export interface SuggestionState {
  items: SuggestionItem[]
  activeIndex: number
  /** Caret rectangle in viewport coordinates, for positioning the popup. */
  rect: DOMRect | null
}

type Listener = () => void

/**
 * The bridge between ProseMirror's suggestion plugin and the React popup.
 *
 * The plugin drives everything through imperative callbacks fired inside a
 * ProseMirror update, so the open/closed state cannot live in React state.
 * It lives here instead and is read through `useSyncExternalStore`.
 *
 * One controller serves both trigger characters — only one can be open at a
 * time, since neither query may contain the other's trigger.
 */
export class SuggestionController {
  private state: SuggestionState | null = null
  private listeners = new Set<Listener>()
  private commit: ((item: SuggestionItem) => void) | null = null

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.state

  private emit() {
    for (const listener of this.listeners) listener()
  }

  open(items: SuggestionItem[], rect: DOMRect | null, commit: (item: SuggestionItem) => void) {
    this.state = { items, activeIndex: 0, rect }
    this.commit = commit
    this.emit()
  }

  /**
   * `commit` is refreshed on every keystroke: the plugin closes over the
   * trigger's range, which grows as the query is typed, and applying a stale
   * one would leave the query text behind.
   */
  update(items: SuggestionItem[], rect: DOMRect | null, commit: (item: SuggestionItem) => void) {
    if (!this.state) return
    this.state = { items, activeIndex: 0, rect }
    this.commit = commit
    this.emit()
  }

  close() {
    if (!this.state) return
    this.state = null
    this.commit = null
    this.emit()
  }

  /** Moves the highlight, wrapping at both ends. Returns false when closed. */
  move(delta: number) {
    if (!this.state || this.state.items.length === 0) return false
    const { items, activeIndex } = this.state
    const next = (activeIndex + delta + items.length) % items.length
    this.state = { ...this.state, activeIndex: next }
    this.emit()
    return true
  }

  select(index: number) {
    if (!this.state) return
    this.state = { ...this.state, activeIndex: index }
    this.emit()
  }

  /** Applies a row. Returns false when there is nothing to apply. */
  choose(index = this.state?.activeIndex ?? -1) {
    const item = this.state?.items[index]
    if (!item || !this.commit) return false
    this.commit(item)
    return true
  }

  get isOpen() {
    return this.state !== null
  }
}

interface SuggestionExtensionConfig {
  /** Unique extension name; also seeds the plugin key. */
  name: string
  char: string
  controller: SuggestionController
  /** Called on every keystroke after the trigger. May resolve asynchronously. */
  search: (query: string) => SuggestionItem[] | Promise<SuggestionItem[]>
  /** Suppresses the trigger unless it starts a word. */
  allowSpaces?: boolean
}

/**
 * Wires `@tiptap/suggestion` up to a {@link SuggestionController}.
 *
 * The plugin owns matching and the range bookkeeping; everything about how the
 * popup looks and behaves lives in React.
 */
export function createSuggestionExtension({
  name,
  char,
  controller,
  search,
  allowSpaces = false,
}: SuggestionExtensionConfig) {
  return Extension.create({
    name,

    addProseMirrorPlugins() {
      const options: SuggestionOptions<SuggestionItem, SuggestionItem> = {
        editor: this.editor,
        char,
        allowSpaces,
        pluginKey: new PluginKey(name),
        items: ({ query }) => search(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => ({
          onStart: (props) => {
            controller.open(props.items, props.clientRect?.() ?? null, (item) =>
              props.command(item),
            )
          },
          onUpdate: (props) => {
            controller.update(props.items, props.clientRect?.() ?? null, (item) =>
              props.command(item),
            )
          },
          onKeyDown: ({ event }) => {
            if (!controller.isOpen) return false

            switch (event.key) {
              case 'ArrowDown':
                return controller.move(1)
              case 'ArrowUp':
                return controller.move(-1)
              case 'Enter':
              case 'Tab':
                return controller.choose()
              case 'Escape':
                controller.close()
                return true
              default:
                return false
            }
          },
          onExit: () => controller.close(),
        }),
      }

      return [Suggestion(options)]
    },
  })
}

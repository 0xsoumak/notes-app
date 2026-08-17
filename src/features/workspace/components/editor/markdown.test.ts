import { Highlight } from '@tiptap/extension-highlight'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { MarkdownManager } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { describe, expect, test } from 'vitest'
import { MarkdownUnderline } from './markdown-underline'

/**
 * Notes are stored as markdown and nothing else, so anything the editor can
 * produce has to come back unchanged on the next open. This exercises the
 * serialiser directly — the same one `editor.getMarkdown()` runs through —
 * without needing a DOM.
 *
 * The extension list mirrors `createEditorExtensions`, minus the suggestion
 * menus and the placeholder, which contribute nothing to the schema.
 */
const manager = new MarkdownManager({
  extensions: [
    StarterKit.configure({ underline: false, link: { openOnClick: false } }),
    MarkdownUnderline,
    Highlight,
    TableKit,
    TaskList,
    TaskItem.configure({ nested: true }),
  ],
})

const roundTrip = (markdown: string) => manager.serialize(manager.parse(markdown)).trim()

describe('markdown round-trip', () => {
  test.each([
    ['inline marks', 'Hello **bold** and *italic* and ~~struck~~ and `code`.'],
    ['underline', 'Some <u>underlined</u> text.'],
    ['highlight', 'Some ==highlighted== text.'],
    ['link', 'A [link](https://example.com) here.'],
    ['heading', '# One\n\n## Two\n\n### Three'],
    ['bullet list', '- one\n- two\n  - nested'],
    ['ordered list', '1. one\n2. two'],
    ['task list', '- [ ] open\n- [x] done'],
    ['blockquote', '> quoted line'],
    ['code block', '```ts\nconst x = 1\n```'],
    ['mixed marks', 'Mix <u>under</u> and ==mark== and **bold**.'],
  ])('%s survives unchanged', (_name, markdown) => {
    expect(roundTrip(markdown)).toBe(markdown)
  })

  // The serialiser pads cells to a common width, so the text differs on the
  // first pass. What matters is that it settles: a second pass is a no-op.
  test('table is stable', () => {
    const once = roundTrip('| a | b |\n| --- | --- |\n| 1 | 2 |')

    expect(once).toBe('| a   | b   |\n| --- | --- |\n| 1   | 2   |')
    expect(roundTrip(once)).toBe(once)
  })
})

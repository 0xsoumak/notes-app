import { Highlight } from '@tiptap/extension-highlight'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { searchEmojiItems } from './emoji-items'
import { MarkdownUnderline } from './markdown-underline'
import { searchSlashItems } from './slash-items'
import { createSuggestionExtension, type SuggestionController } from './suggestion'

/**
 * The editor's schema.
 *
 * Every node and mark here survives a markdown round-trip: StarterKit covers
 * the paragraph, heading, list, blockquote and code-block nodes, TableKit and
 * TaskList add the two GFM ones, and Highlight serialises to `==marked==`.
 *
 * Built per editor rather than shared, because the suggestion menus close over
 * the controller belonging to one editor instance.
 */
export function createEditorExtensions(suggestions: SuggestionController) {
  return [
    StarterKit.configure({
      // Replaced by `MarkdownUnderline`, which can round-trip through markdown.
      underline: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    MarkdownUnderline,
    Highlight,
    TableKit.configure({ table: { resizable: true } }),
    // Not part of StarterKit. Serialises to GFM's `- [ ]` / `- [x]`.
    TaskList,
    TaskItem.configure({ nested: true }),
    createSuggestionExtension({
      name: 'slashMenu',
      char: '/',
      controller: suggestions,
      search: searchSlashItems,
    }),
    createSuggestionExtension({
      name: 'emojiMenu',
      char: ':',
      controller: suggestions,
      search: searchEmojiItems,
    }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'heading' ? 'Heading' : "Write something...",
    }),
    // Must come last: it builds its parser and serialiser from the extensions
    // registered before it.
    Markdown,
  ]
}

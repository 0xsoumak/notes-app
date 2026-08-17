import { Underline } from '@tiptap/extension-underline'

/**
 * Underline, taught to survive a markdown round-trip.
 *
 * Markdown has no underline syntax, so `@tiptap/extension-underline` ships
 * without a markdown spec and the mark would be silently dropped on save.
 * Notes are stored as markdown and nothing else, so it goes through the `<u>`
 * HTML tag instead — legal inline markdown, and the same shape the extension's
 * own `parseHTML` already accepts.
 *
 * The custom tokenizer is what makes the parse direction work: left to itself,
 * marked emits the opening and closing tags as inline-HTML tokens separate from
 * the text between them, and the mark has nothing to wrap.
 */
export const MarkdownUnderline = Underline.extend({
  markdownTokenName: 'underline',

  renderMarkdown: (node, helpers) => `<u>${helpers.renderChildren(node)}</u>`,

  parseMarkdown: (token, helpers) =>
    helpers.applyMark('underline', helpers.parseInline(token.tokens ?? [])),

  markdownTokenizer: {
    name: 'underline',
    level: 'inline',
    start: (src) => src.indexOf('<u>'),
    tokenize(src, _tokens, helpers) {
      const match = /^<u>([\s\S]+?)<\/u>/.exec(src)
      if (!match) return undefined

      return {
        type: 'underline',
        raw: match[0],
        text: match[1],
        tokens: helpers.inlineTokens(match[1]),
      }
    },
  },
})

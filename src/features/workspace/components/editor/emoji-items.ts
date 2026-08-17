import type { SuggestionItem } from './suggestion'

/**
 * A bare `:` is ordinary punctuation, so the menu stays shut until enough of a
 * name has been typed for the trigger to be unambiguous.
 */
const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 12

let items: Promise<SuggestionItem[]> | null = null

/**
 * The emoji dataset, fetched on first use and kept thereafter.
 *
 * `@tiptap/extension-emoji` is pulled in only for its list — over half a
 * megabyte of it — and most notes never type a `:`. Loading it lazily keeps it
 * out of the initial bundle entirely.
 *
 * Emoji are inserted as their literal unicode character rather than as the
 * extension's node type, which has no markdown representation. Notes are
 * stored as markdown and nothing else, and a bare character survives every
 * round-trip for free.
 */
function loadItems(): Promise<SuggestionItem[]> {
  items ??= import('@tiptap/extension-emoji').then(({ gitHubEmojis }) =>
    gitHubEmojis.flatMap((emoji) => {
      // A few GitHub entries are image-only (`:octocat:`) and have no character.
      const character = emoji.emoji
      if (!character) return []

      return {
        id: emoji.name,
        label: emoji.name.replace(/_/g, ' '),
        keywords: [...emoji.shortcodes, ...emoji.tags],
        glyph: character,
        hint: `:${emoji.name}:`,
        run: (editor, range) =>
          editor.chain().focus().deleteRange(range).insertContent(character).run(),
      }
    }),
  )

  return items
}

export async function searchEmojiItems(query: string): Promise<SuggestionItem[]> {
  const needle = query.trim().toLowerCase()
  if (needle.length < MIN_QUERY_LENGTH) return []

  // Name matches rank above tag matches, so "smi" surfaces "smile" ahead of
  // everything merely tagged "smiley".
  const byName: SuggestionItem[] = []
  const byKeyword: SuggestionItem[] = []

  for (const item of await loadItems()) {
    if (item.id.includes(needle)) byName.push(item)
    else if (item.keywords?.some((keyword) => keyword.includes(needle))) byKeyword.push(item)

    if (byName.length >= MAX_RESULTS) break
  }

  return [...byName, ...byKeyword].slice(0, MAX_RESULTS)
}

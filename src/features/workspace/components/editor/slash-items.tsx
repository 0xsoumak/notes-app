import {
  BulletListIcon,
  CodeBlockIcon,
  HeadingOneIcon,
  HeadingThreeIcon,
  HeadingTwoIcon,
  OrderedListIcon,
  QuoteIcon,
  TableIcon,
  TaskListIcon,
} from '@/components/ui/icons'
import type { Editor, Range } from '@tiptap/core'
import type { SuggestionItem } from './suggestion'

/** Clears the `/query` text before running a block command. */
const at = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range)

const items: SuggestionItem[] = [
  {
    id: 'heading-1',
    label: 'Heading 1',
    keywords: ['h1', 'title'],
    glyph: <HeadingOneIcon />,
    run: (editor, range) => at(editor, range).setNode('heading', { level: 1 }).run(),
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    keywords: ['h2', 'subtitle'],
    glyph: <HeadingTwoIcon />,
    run: (editor, range) => at(editor, range).setNode('heading', { level: 2 }).run(),
  },
  {
    id: 'heading-3',
    label: 'Heading 3',
    keywords: ['h3'],
    glyph: <HeadingThreeIcon />,
    run: (editor, range) => at(editor, range).setNode('heading', { level: 3 }).run(),
  },
  {
    id: 'bullet-list',
    label: 'Bulleted list',
    keywords: ['ul', 'unordered', 'point'],
    glyph: <BulletListIcon />,
    run: (editor, range) => at(editor, range).toggleBulletList().run(),
  },
  {
    id: 'ordered-list',
    label: 'Numbered list',
    keywords: ['ol', 'ordered', 'number'],
    glyph: <OrderedListIcon />,
    run: (editor, range) => at(editor, range).toggleOrderedList().run(),
  },
  {
    id: 'task-list',
    label: 'To-do list',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    glyph: <TaskListIcon />,
    run: (editor, range) => at(editor, range).toggleTaskList().run(),
  },
  {
    id: 'blockquote',
    label: 'Quote',
    keywords: ['blockquote', 'citation'],
    glyph: <QuoteIcon />,
    run: (editor, range) => at(editor, range).toggleBlockquote().run(),
  },
  {
    id: 'code-block',
    label: 'Code block',
    keywords: ['pre', 'snippet', 'fence'],
    glyph: <CodeBlockIcon />,
    run: (editor, range) => at(editor, range).toggleCodeBlock().run(),
  },
  {
    id: 'table',
    label: 'Table',
    keywords: ['grid', 'rows', 'columns'],
    glyph: <TableIcon />,
    hint: '3 × 3',
    run: (editor, range) =>
      at(editor, range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
]

/** Matches the `/` query against each command's label and keywords. */
export function searchSlashItems(query: string): SuggestionItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return items

  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(needle) ||
      item.keywords?.some((keyword) => keyword.startsWith(needle)),
  )
}

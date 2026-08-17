import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { useMemo } from 'react'
import { TrashIcon } from '@/components/ui/icons'
import { MenuBar, MenuButton, MenuDivider } from './MenuButton'

/**
 * Row and column controls, shown whenever the caret is inside a table.
 *
 * Markdown has no syntax for adding or removing a column, so this toolbar is
 * the only way to reshape a table. It keys off the caret rather than a text
 * selection, unlike the format menu.
 */
export function TableMenu({ editor }: { editor: Editor }) {
  const options = useMemo(() => ({ placement: 'top' as const }), [])

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      shouldShow={({ editor }) => editor.isActive('table')}
      options={options}
    >
      <MenuBar>
        <MenuButton
          variant="text"
          label="Add row"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        />
        <MenuButton
          variant="text"
          label="Delete row"
          onClick={() => editor.chain().focus().deleteRow().run()}
        />

        <MenuDivider />

        <MenuButton
          variant="text"
          label="Add column"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        />
        <MenuButton
          variant="text"
          label="Delete column"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        />

        <MenuDivider />

        <MenuButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
          <TrashIcon />
        </MenuButton>
      </MenuBar>
    </BubbleMenu>
  )
}

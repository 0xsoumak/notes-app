import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { useEditorState } from '@tiptap/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BoldIcon,
  CheckIcon,
  ClearFormattingIcon,
  CodeIcon,
  HighlightIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UnlinkIcon,
} from '@/components/ui/icons'
import { MenuBar, MenuButton, MenuDivider } from './MenuButton'

/**
 * Inline formatting toolbar, shown while text is selected.
 *
 * Selecting a link swaps the buttons for an href field; the toolbar is a single
 * popup either way so it never moves out from under the pointer.
 */
export function FormatMenu({ editor }: { editor: Editor }) {
  const [isEditingLink, setIsEditingLink] = useState(false)

  // Memoised because the plugin reconfigures itself whenever this changes.
  const options = useMemo(() => ({ onHide: () => setIsEditingLink(false) }), [])

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      underline: editor.isActive('underline'),
      code: editor.isActive('code'),
      highlight: editor.isActive('highlight'),
      link: editor.isActive('link'),
      href: (editor.getAttributes('link').href as string | undefined) ?? '',
    }),
  })

  return (
    <BubbleMenu
      editor={editor}
      // Code blocks are verbatim text: none of these marks may be applied
      // inside one, and a table selection gets its own toolbar instead.
      shouldShow={({ editor, from, to }) =>
        from !== to && !editor.isActive('codeBlock') && !editor.isActive('table')
      }
      options={options}
    >
      <MenuBar>
        {isEditingLink ? (
          <LinkField
            editor={editor}
            initialHref={active.href}
            onClose={() => setIsEditingLink(false)}
          />
        ) : (
          <>
            <MenuButton
              label="Bold"
              isActive={active.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <BoldIcon />
            </MenuButton>
            <MenuButton
              label="Italic"
              isActive={active.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <ItalicIcon />
            </MenuButton>
            <MenuButton
              label="Strikethrough"
              isActive={active.strike}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <StrikethroughIcon />
            </MenuButton>
            <MenuButton
              label="Underline"
              isActive={active.underline}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon />
            </MenuButton>
            <MenuButton
              label="Inline code"
              isActive={active.code}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <CodeIcon />
            </MenuButton>
            <MenuButton
              label="Highlight"
              isActive={active.highlight}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <HighlightIcon />
            </MenuButton>

            <MenuDivider />

            <MenuButton label="Link" isActive={active.link} onClick={() => setIsEditingLink(true)}>
              <LinkIcon />
            </MenuButton>
            {active.link && (
              <MenuButton
                label="Remove link"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                <UnlinkIcon />
              </MenuButton>
            )}

            <MenuDivider />

            {/* Marks only — the block type is left alone, so clearing the
                formatting inside a heading does not flatten the heading. */}
            <MenuButton
              label="Clear formatting"
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
            >
              <ClearFormattingIcon />
            </MenuButton>
          </>
        )}
      </MenuBar>
    </BubbleMenu>
  )
}

interface LinkFieldProps {
  editor: Editor
  initialHref: string
  onClose: () => void
}

/** The href editor. Submitting an empty value removes the link. */
function LinkField({ editor, initialHref, onClose }: LinkFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  const submit = () => {
    const href = inputRef.current?.value.trim() ?? ''
    const chain = editor.chain().focus()

    if (href) chain.setLink({ href }).run()
    else chain.unsetLink().run()

    onClose()
  }

  return (
    <>
      <input
        ref={inputRef}
        type="url"
        defaultValue={initialHref}
        placeholder="https://…"
        aria-label="Link address"
        spellCheck={false}
        className="text-content placeholder:text-content-muted/60 w-56 bg-transparent px-2 text-sm outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
            editor.commands.focus()
          }
        }}
      />
      <MenuButton label="Apply link" onMouseDown={(event) => event.preventDefault()} onClick={submit}>
        <CheckIcon />
      </MenuButton>
    </>
  )
}

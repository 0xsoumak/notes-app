import { TaskItem as TaskItemExtension } from '@tiptap/extension-list'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/core'
import { Checkbox } from '@base-ui/react/checkbox'
import { CheckIcon } from '@/components/ui/icons'

/**
 * A to-do item's checkbox, as a Base UI {@link Checkbox}.
 *
 * `TaskItem`'s default `renderHTML` emits a bare native `<input type="checkbox">`
 * inside a `<label>`, styled only through global `input[type='checkbox']`
 * rules — which puts it at the mercy of the browser's own UA stylesheet for
 * layout (native checkboxes don't reliably respect `align-items` the way a
 * custom control does) and gives it none of the app's focus ring or hover
 * states. A node view swaps that markup for the same control used everywhere
 * else, wired to the node's `checked` attribute directly.
 */
function TaskItemView({ node, updateAttributes }: NodeViewProps) {
  const checked = Boolean(node.attrs.checked)

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={checked}
      className="flex items-start gap-2"
    >
      <Checkbox.Root
        checked={checked}
        onCheckedChange={(next) => updateAttributes({ checked: next })}
        // Keeps the box on the first line's baseline rather than its top.
        className="border-content-muted/50 data-[checked]:bg-accent data-[checked]:border-accent focus-visible:ring-accent/40 mt-[0.3em] flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border transition focus-visible:ring-2 focus-visible:outline-none"
      >
        <Checkbox.Indicator className="text-surface flex items-center justify-center">
          <CheckIcon weight="bold" className="size-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>

      <NodeViewContent
        as="div"
        className="min-w-0 flex-1 [&[data-checked=true]]:text-content-muted [&[data-checked=true]]:line-through"
        data-checked={checked}
      />
    </NodeViewWrapper>
  )
}

/**
 * `TaskItem`, configured to render through {@link TaskItemView}.
 *
 * Only the node view changes — attributes, markdown parsing and rendering all
 * stay the base extension's, so the on-disk `- [ ]` / `- [x]` markdown is
 * unaffected.
 */
export const TaskItem = TaskItemExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView)
  },
})

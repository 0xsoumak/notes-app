# Notes

A Notion-style notes app: a nested folder tree in the sidebar, drag-and-drop
reordering, and a BlockNote rich-text editor.

React 19 · TypeScript · Vite · Tailwind v4 · BlockNote · dnd-kit · Phosphor icons

```bash
pnpm dev      # dev server
pnpm build    # typecheck + production build
pnpm test     # unit tests (tree logic)
pnpm lint     # oxlint
```

## Architecture

```
src/
├── app/                    # composition root
│   ├── App.tsx
│   ├── router.tsx          # route table
│   └── providers/          # theme + app-wide context
├── components/
│   ├── layout/             # AppShell, Sidebar, EmptyState
│   └── ui/                 # Button, IconButton, ThemeToggle, icons
├── features/
│   └── workspace/          # the one domain feature
│       ├── api/            # repository interface + localStorage impl
│       ├── store/          # reducer, context, provider
│       ├── hooks/          # useWorkspace, useNote, useExpandedIds
│       ├── tree/           # pure tree logic (flatten, projection, move)
│       ├── components/
│       │   ├── tree/       # sidebar tree + drag and drop
│       │   └── editor/     # BlockNote editor
│       └── index.ts        # public surface — import from here
├── lib/                    # cn, id, format-date, shared hooks
├── pages/                  # HomePage, NotePage
└── styles/                 # Tailwind entry, design tokens, base
```

Imports use the `@/` alias for `src/` (declared in both `vite.config.ts` and
`tsconfig.app.json`).

### The workspace model

Folders and notes are the same kind of record, discriminated by `kind`:

```ts
type WorkspaceItem = FolderItem | NoteItem
```

Both carry `parentId` and `order`, which is the whole tree structure. Only
folders may have children, and nesting is unlimited in depth.

### Swapping in the backend

Everything above `features/workspace/api/` is storage-agnostic. The UI talks to
the `WorkspaceRepository` interface, whose methods are already async even though
today's implementation is synchronous localStorage.

To connect a real backend, write `createHttpWorkspaceRepository()` against the
same interface and change the one line in `features/workspace/api/index.ts`. No
component or hook needs to change.

### Drag and drop

`features/workspace/tree/` holds the tree logic as pure functions, separate from
React and dnd-kit's event plumbing, which is what makes it directly testable:

- **`flatten-tree.ts`** — turns the tree into the flat list of visible rows the
  sortable context needs. While dragging, it hides the dragged subtree so a
  folder can never be dropped inside itself.
- **`drop-projection.ts`** — reads horizontal drag distance as a change in
  depth (drag right to nest, left to move out) and clamps the result to a legal
  position. Notes never gain children.
- **`move-item.ts`** — translates a drop into the minimal set of position
  changes, renumbering the sibling groups the item left and joined.

Covered by `tree/tree.test.ts`.

## Editor notes

BlockNote seeds its document once when the editor is created, so `NoteEditor` is
remounted per note via `key={note.id}`. Edits are debounced (600 ms) before they
reach the repository, and a pending save carries its note id so navigating away
mid-edit still writes to the right note.

Stylesheet order is load-bearing and is set by the import order in `main.tsx`:
Tailwind preflight first, then BlockNote's stylesheets, then our overrides.

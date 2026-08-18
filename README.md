# Notes

A Notion-style notes app: a nested folder tree in the sidebar, drag-and-drop
reordering, and a BlockNote rich-text editor. Notes are stored as `.md` files
in a GitHub repository you own, mirroring the sidebar's folder structure.

React 19 · TypeScript · Vite · Tailwind v4 · BlockNote · dnd-kit · Dexie ·
Phosphor icons

```bash
cp .env.example .env   # set VITE_GITHUB_OWNER / VITE_GITHUB_REPO
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
│       ├── paths.ts        # the path model — an item's identity
│       ├── data/           # Dexie schema, local mutations, tree derivation
│       ├── github/         # REST client, credentials, base64
│       ├── sync/           # pull/push engine + provider
│       ├── store/          # context + provider over Dexie live queries
│       ├── hooks/          # useWorkspace, useNote, useExpandedIds
│       ├── tree/           # pure tree logic (flatten, projection, move)
│       ├── components/
│       │   ├── tree/       # sidebar tree + drag and drop
│       │   ├── editor/     # BlockNote editor
│       │   └── sync/       # sync button and status
│       └── index.ts        # public surface — import from here
├── lib/                    # cn, id, format-date, shared hooks
├── pages/                  # HomePage, NotePage
└── styles/                 # Tailwind entry, design tokens, base
```

Imports use the `@/` alias for `src/` (declared in both `vite.config.ts` and
`tsconfig.app.json`).

### The workspace model

An item's **id is its repo path** — `personal/notes/thoughts/today.md` for a
note, `personal/notes/thoughts` for a folder. Folders are never stored: they
are inferred from the path segments of the files beneath them, exactly as Git
models them. An empty folder therefore needs a `.gitkeep` to exist at all.

Two things Git cannot represent are kept in a sidecar `.notes-index.json` at
the repo root: **sibling order** and **per-note icons**. Anything missing from
it falls back to folders-first, then alphabetical.

Renaming a note renames its file. Moving it between folders moves the file.
Both change the id, so the URL follows along.

### Local-first sync

```
BlockNote  ──►  Dexie (IndexedDB)  ──[ Sync ]──►  GitHub REST API
```

Edits land in IndexedDB immediately and are never blocked on the network.
Pressing **Sync** runs `features/workspace/sync/sync-engine.ts`:

1. **Pull** — one recursive Trees call, compare SHAs, fetch changed blobs.
2. **Push** — deletes, then moves, then content writes.

Each row records a `remotePath` alongside its local `path`. When they diverge,
the file was moved locally, and the push turns that into a **real Git move**
via the Git Data API — one commit for the whole batch, so renaming a folder of
fifty notes is one commit rather than a hundred API calls.

Conflict policy is **local-wins**: a file with unpushed edits is never
overwritten by a pull, and its push retries against the current remote SHA.
That suits a single-author notebook; editing the same note on two devices
between syncs would need real merging.

### Credentials

The repository is fixed per deployment: `VITE_GITHUB_OWNER` and
`VITE_GITHUB_REPO` come from `.env` (copy `.env.example`) and are baked into
the build. Only the **token** and the **branch** (`main` or `dev`) are set in
Settings, and both live in `localStorage`.

The token is deliberately *not* an env var — a client-side bundle cannot hold
a secret, so a `VITE_`-prefixed token would be compiled into `dist/` for
anyone to read. Everything is read through
`features/workspace/github/github-config.ts`, so moving to GitHub OAuth later
means changing that one module.

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

Notes are stored as plain markdown, so the editor parses markdown in on mount
and serialises back out on change. **BlockNote's markdown export is lossy** —
some blocks and inline styles do not survive a round-trip. That is the accepted
trade for readable `.md` files you can edit on GitHub directly.

`NoteEditor` is remounted per note via `key={note.id}` so hydration runs against
the right document. Edits are debounced (600 ms) before reaching IndexedDB, and
a pending save carries its note path so navigating away mid-edit still writes to
the right note. Title edits commit on blur or Enter, never per keystroke —
each one renames a file.

Stylesheet order is load-bearing and is set by the import order in `main.tsx`:
Tailwind preflight first, then BlockNote's stylesheets, then our overrides.

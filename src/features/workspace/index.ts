/** Public surface of the workspace feature — import from here, not from subpaths. */
export { NoteEditor } from './components/editor/NoteEditor'
export { RevertAllButton } from './components/sync/RevertAllButton'
export { SyncButton } from './components/sync/SyncButton'
export { TreeView } from './components/tree/TreeView'
export { useExpandedIds } from './hooks/use-expanded-ids'
export { useNote } from './hooks/use-note'
export { useNotePath } from './hooks/use-note-path'
export { useWorkspace } from './hooks/use-workspace'
export { WorkspaceProvider } from './store/WorkspaceProvider'
export { SyncProvider } from './sync/SyncProvider'
export { useSync } from './sync/sync-context'
export {
  BRANCHES,
  buildConfig,
  DEFAULT_BRANCH,
  isRepoConfigured,
  REPO_NAME,
  REPO_OWNER,
} from './github/github-config'
export type { Branch, GitHubConfig } from './github/github-config'
export { isFolder, isNote } from './types'
export type { FolderItem, NoteItem, WorkspaceItem } from './types'

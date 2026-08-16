import { createLocalWorkspaceRepository } from './local-workspace-repository'
import type { WorkspaceRepository } from './workspace-repository'

/**
 * The single place the app decides where the workspace comes from. When the
 * backend lands, replace this with `createHttpWorkspaceRepository(...)`.
 */
export const workspaceRepository: WorkspaceRepository = createLocalWorkspaceRepository()

export {
  DEFAULT_FOLDER_ICON,
  DEFAULT_FOLDER_TITLE,
  DEFAULT_NOTE_ICON,
  DEFAULT_NOTE_TITLE,
} from './local-workspace-repository'
export type { WorkspaceRepository } from './workspace-repository'

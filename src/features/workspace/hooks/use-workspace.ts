import { useWorkspaceContext } from '../store/workspace-context'

/** The whole item tree plus the mutations that act on it. */
export function useWorkspace() {
  return useWorkspaceContext()
}

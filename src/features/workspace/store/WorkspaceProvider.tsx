import { useCallback, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { buildItems, collectChangedIds } from '../data/build-items'
import { db } from '../data/db'
import { parseNotesIndex } from '../data/notes-index'
import { revertAll, revertItem } from '../data/revert'
import * as store from '../data/workspace-store'
import { INDEX_FILE } from '../paths'
import type { DropTarget } from '../tree/drop-projection'
import { moveItem as computeMoves } from '../tree/move-item'
import { WorkspaceContext, type WorkspaceContextValue } from './workspace-context'

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  // Dexie pushes a new array whenever the table changes, so every mutation
  // below is write-only — there is no local state to keep in step.
  const files = useLiveQuery(() => db.files.toArray(), [])

  const items = useMemo(() => {
    if (!files) return []
    const indexRow = files.find((file) => file.path === INDEX_FILE)
    return buildItems(files, indexRow ? parseNotesIndex(indexRow.content) : {})
  }, [files])

  const pendingCount = useMemo(
    () => (files ?? []).filter((file) => file.isDirty === 1).length,
    [files],
  )

  const changedIds = useMemo(() => collectChangedIds(files ?? []), [files])

  const moveItem = useCallback(
    async (activeId: string, target: DropTarget) => {
      const positions = computeMoves(items, activeId, target)
      if (positions.length === 0) return activeId
      return store.applyPositions(activeId, positions)
    },
    [items],
  )

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      items,
      isLoading: files === undefined,
      pendingCount,
      changedIds,
      createNote: (parentId = null) => store.createNote(parentId),
      createFolder: async (parentId = null) => {
        await store.createFolder(parentId)
      },
      renameItem: store.renameItem,
      setItemIcon: store.setItemIcon,
      deleteItem: store.deleteItem,
      moveItem,
      revertItem: async (id) => (await revertItem(id)).restoredPath,
      revertAll,
    }),
    [items, files, pendingCount, changedIds, moveItem],
  )

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}

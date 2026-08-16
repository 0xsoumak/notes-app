import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { workspaceRepository } from '../api'
import type { DropTarget } from '../tree/drop-projection'
import { moveItem as computeMoves } from '../tree/move-item'
import type { ItemPatch, WorkspaceItem } from '../types'
import { WorkspaceContext, type WorkspaceContextValue } from './workspace-context'
import {
  initialWorkspaceState,
  workspaceReducer,
} from './workspace-reducer'

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState)

  // `moveItem` needs the current tree without re-creating its callback on every
  // edit, which would restart the drag session mid-gesture.
  const itemsRef = useRef<WorkspaceItem[]>(state.items)
  itemsRef.current = state.items

  useEffect(() => {
    let cancelled = false

    workspaceRepository
      .list()
      .then((items) => {
        if (!cancelled) dispatch({ type: 'loaded', items })
      })
      .catch((error: unknown) => {
        if (!cancelled) dispatch({ type: 'failed', error: toMessage(error) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const createNote = useCallback(async (parentId: string | null = null) => {
    const note = await workspaceRepository.createNote(parentId)
    dispatch({ type: 'upserted', item: note })
    return note
  }, [])

  const createFolder = useCallback(async (parentId: string | null = null) => {
    const folder = await workspaceRepository.createFolder(parentId)
    dispatch({ type: 'upserted', item: folder })
    return folder
  }, [])

  const updateItem = useCallback(async (id: string, patch: ItemPatch) => {
    const item = await workspaceRepository.update(id, patch)
    dispatch({ type: 'upserted', item })
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const removedIds = await workspaceRepository.remove(id)
    dispatch({ type: 'removed', ids: removedIds })
    return removedIds
  }, [])

  const moveItem = useCallback(async (activeId: string, target: DropTarget) => {
    const positions = computeMoves(itemsRef.current, activeId, target)
    if (positions.length === 0) return

    const items = await workspaceRepository.move(positions)
    dispatch({ type: 'moved', items })
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      items: state.items,
      status: state.status,
      error: state.error,
      createNote,
      createFolder,
      updateItem,
      deleteItem,
      moveItem,
    }),
    [state, createNote, createFolder, updateItem, deleteItem, moveItem],
  )

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong loading your workspace.'
}

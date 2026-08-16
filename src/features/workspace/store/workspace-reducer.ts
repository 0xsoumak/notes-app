import type { WorkspaceItem } from '../types'

export type WorkspaceStatus = 'loading' | 'ready' | 'error'

export interface WorkspaceState {
  items: WorkspaceItem[]
  status: WorkspaceStatus
  error: string | null
}

export type WorkspaceAction =
  | { type: 'loaded'; items: WorkspaceItem[] }
  | { type: 'failed'; error: string }
  | { type: 'upserted'; item: WorkspaceItem }
  | { type: 'removed'; ids: string[] }
  | { type: 'moved'; items: WorkspaceItem[] }

export const initialWorkspaceState: WorkspaceState = {
  items: [],
  status: 'loading',
  error: null,
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'loaded':
      return { items: action.items, status: 'ready', error: null }

    case 'failed':
      return { ...state, status: 'error', error: action.error }

    case 'upserted': {
      const exists = state.items.some((item) => item.id === action.item.id)
      return {
        ...state,
        items: exists
          ? state.items.map((item) => (item.id === action.item.id ? action.item : item))
          : [...state.items, action.item],
      }
    }

    case 'removed': {
      const removed = new Set(action.ids)
      return { ...state, items: state.items.filter((item) => !removed.has(item.id)) }
    }

    case 'moved': {
      const moved = new Map(action.items.map((item) => [item.id, item]))
      return { ...state, items: state.items.map((item) => moved.get(item.id) ?? item) }
    }
  }
}

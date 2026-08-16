import { useCallback, useState } from 'react'

const STORAGE_KEY = 'notes-app:expanded-folders'

function readInitial(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
  } catch {
    return new Set()
  }
}

function persist(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Losing expand state is not worth surfacing to the user.
  }
}

/**
 * Which folders are open. Kept out of the workspace store because it is view
 * state — it never round-trips to the backend.
 */
export function useExpandedIds() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(readInitial)

  const update = useCallback((mutate: (next: Set<string>) => void) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      mutate(next)
      persist(next)
      return next
    })
  }, [])

  const toggle = useCallback(
    (id: string) => {
      update((next) => {
        if (!next.delete(id)) next.add(id)
      })
    },
    [update],
  )

  const expand = useCallback(
    (ids: string[]) => {
      update((next) => {
        for (const id of ids) next.add(id)
      })
    },
    [update],
  )

  return { expandedIds, toggle, expand }
}

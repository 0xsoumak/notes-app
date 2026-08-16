import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query.
 *
 * `useSyncExternalStore` rather than state-plus-effect: the first render reads
 * the real value instead of a guess, so the shell never paints a desktop
 * layout on a phone and then snaps to the mobile one.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  // No SSR here, but a stable server snapshot keeps the hook safe if the app is
  // ever prerendered.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

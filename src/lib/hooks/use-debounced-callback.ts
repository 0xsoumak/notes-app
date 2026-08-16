import { useEffect, useMemo, useRef } from 'react'

/**
 * Returns a debounced version of `callback`. The latest callback is always
 * invoked, so the returned function is stable and safe in dependency arrays.
 * Pending work is flushed on unmount so in-flight edits are never dropped.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgsRef = useRef<Args | null>(null)

  const controls = useMemo(() => {
    const flush = () => {
      if (timerRef.current === null) return
      clearTimeout(timerRef.current)
      timerRef.current = null

      const args = pendingArgsRef.current
      pendingArgsRef.current = null
      if (args) callbackRef.current(...args)
    }

    const run = (...args: Args) => {
      pendingArgsRef.current = args
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        pendingArgsRef.current = null
        callbackRef.current(...args)
      }, delay)
    }

    return { run, flush }
  }, [delay])

  useEffect(() => controls.flush, [controls])

  return controls
}

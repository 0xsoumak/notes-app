const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const absoluteFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/**
 * "just now" / "3 hours ago" / "Mar 4, 2026" — falls back to an absolute date
 * once the timestamp is more than a week old.
 *
 * Accepts an ISO string or an epoch milliseconds value.
 */
export function formatRelativeTime(date: string | number): string {
  const timestamp = typeof date === 'number' ? date : new Date(date).getTime()
  if (!timestamp || Number.isNaN(timestamp)) return 'never'

  const elapsed = Date.now() - timestamp
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return relativeFormatter.format(-Math.floor(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return relativeFormatter.format(-Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < WEEK) return relativeFormatter.format(-Math.floor(elapsed / DAY), 'day')
  return absoluteFormatter.format(timestamp)
}

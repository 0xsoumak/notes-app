type ClassValue = string | false | null | undefined

/**
 * Joins conditional class names. Kept dependency-free on purpose — if we ever
 * need conflict resolution between Tailwind utilities, swap the body for
 * `twMerge(clsx(values))` and every call site keeps working.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}

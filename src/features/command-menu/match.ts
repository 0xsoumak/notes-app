/**
 * Ranking for the command menu.
 *
 * Subsequence matching rather than substring: "nn" should find "New note" and
 * "stdup" should find "2026-03-04 standup", which is how every palette of this
 * kind behaves. Scoring only has to be good enough to float the obvious answer
 * to the top — the list is short and the user can see it.
 */

/** A match, plus the indices that matched so the UI can highlight them. */
export interface MatchResult {
  score: number
  indices: number[]
}

const SCORE_EXACT = 1000
const SCORE_PREFIX = 500
/** Every character landed on a word start — "nf" for "new folder". */
const SCORE_ACRONYM = 400
const SCORE_SUBSTRING = 250
const SCORE_WORD_START = 40
const SCORE_CONSECUTIVE = 12
const PENALTY_PER_GAP = 1

/** Characters after which the next one starts a new word. */
function isBoundary(character: string): boolean {
  return character === ' ' || character === '-' || character === '_' || character === '/'
}

/**
 * Scores `query` against `text`, case-insensitively. Returns `null` when the
 * query is not a subsequence of the text — that is the filter.
 *
 * An empty query matches everything with a score of 0, which leaves the
 * caller's own ordering (recency, declaration order) intact.
 */
export function matchScore(text: string, query: string): MatchResult | null {
  if (!query) return { score: 0, indices: [] }

  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()

  const indices: number[] = []
  let score = 0
  let cursor = 0
  let previousIndex = -2
  let allOnWordStarts = true

  for (const character of needle) {
    const index = haystack.indexOf(character, cursor)
    if (index === -1) return null

    indices.push(index)
    if (index === previousIndex + 1) score += SCORE_CONSECUTIVE
    if (index === 0 || isBoundary(haystack[index - 1])) score += SCORE_WORD_START
    else allOnWordStarts = false
    score -= (index - cursor) * PENALTY_PER_GAP

    previousIndex = index
    cursor = index + 1
  }

  // Initials are how people reach for a command they already know the name of,
  // so an acronym hit has to outrank the same letters buried in one long word.
  if (allOnWordStarts && needle.length > 1) score += SCORE_ACRONYM

  // Whole-string wins outrank any accumulation of per-character bonuses, so a
  // typed-out title never loses to an incidental subsequence elsewhere.
  if (haystack === needle) score += SCORE_EXACT
  else if (haystack.startsWith(needle)) score += SCORE_PREFIX
  else if (haystack.includes(needle)) score += SCORE_SUBSTRING

  return { score, indices }
}

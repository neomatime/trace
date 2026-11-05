/**
 * Pure normalisation of element names typed by a user (inline editor or the
 * properties panel). No DOM or diagram-js imports, so it runs under node.
 */

export const NAME_MAX_LENGTH = 120

/**
 * Trim, turn every whitespace run (spaces, tabs, newlines) into one space and
 * cap at 120 characters. Empty or whitespace-only input returns `undefined`,
 * which clears the name. Never splits a surrogate pair at the limit and never
 * leaves a trailing space after truncating.
 */
export function normalizeElementName(raw: string): string | undefined {
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  if (collapsed === '') return undefined
  if (collapsed.length <= NAME_MAX_LENGTH) return collapsed
  let end = NAME_MAX_LENGTH
  const last = collapsed.charCodeAt(end - 1)
  if (last >= 0xd800 && last <= 0xdbff) end -= 1 // would cut a surrogate pair in half
  return collapsed.slice(0, end).trimEnd()
}

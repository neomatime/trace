/**
 * Find an element by (part of) its name for the toolbar search. Pure, so it
 * runs under node for unit tests.
 */

export interface NamedElement {
  id: string
  name?: string | null
}

/**
 * Best match for `query` in diagram order: an exact name first, then a name
 * starting with the query, then any name containing it. Case-insensitive;
 * blank queries and unnamed elements never match.
 */
export function findElementByName(elements: readonly NamedElement[], query: string): string | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  let starts: string | null = null
  let contains: string | null = null
  for (const element of elements) {
    const name = (element.name ?? '').trim().toLowerCase()
    if (!name) continue
    if (name === needle) return element.id
    if (starts === null && name.startsWith(needle)) starts = element.id
    else if (contains === null && name.includes(needle)) contains = element.id
  }
  return starts ?? contains
}

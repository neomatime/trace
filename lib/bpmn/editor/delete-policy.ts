/**
 * What may be deleted. Pure, so it runs under node for unit tests; used by
 * the `elements.delete` rule (rules.ts) and the context pad's Delete entry.
 */

interface Typed {
  type?: string
}

/** Lanes are removed with their pool only; lane editing arrives with Task 12. */
export function excludeLanes<T extends Typed>(elements: readonly T[]): T[] {
  return elements.filter((element) => element.type !== 'bpmn:Lane')
}

/**
 * Turn an `elements.delete` rule result into the elements to remove:
 * false means none, an array means exactly those, anything else (true, or no
 * rule) means the whole selection.
 */
export function resolveDeletable<T>(allowed: unknown, elements: readonly T[]): T[] {
  if (allowed === false) return []
  if (Array.isArray(allowed)) return [...(allowed as T[])]
  return [...elements]
}

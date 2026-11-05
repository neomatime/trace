/**
 * What deleting does. Pure, so it runs under node for unit tests. One policy
 * for every way of deleting: the `elements.delete` rule (rules.ts) decides
 * what may go, and both the Delete key (diagram-js `removeSelection`) and the
 * context pad's Delete entry resolve the rule result with `resolveDeletable`
 * and run `modeling.removeElements`, where the lane behaviour
 * (lane-behaviour.ts) applies `survivorsOfLaneDelete`.
 */

interface Typed {
  type?: string
  parent?: unknown
}

interface Tree extends Typed {
  children?: Tree[]
  waypoints?: unknown[]
}

/** Everything on the canvas may be deleted (pools, lanes, steps, flows); roots may not. */
export function deletableElements<T extends Typed>(elements: readonly T[]): T[] {
  return elements.filter((element) => !!element.parent)
}

/** The lanes in a selection. */
export function lanesAmong<T extends Typed>(elements: readonly T[]): T[] {
  return elements.filter((element) => element.type === 'bpmn:Lane')
}

/**
 * Deleting a lane keeps its steps, any child lanes and any flows drawn inside
 * it (diagram-js parents a flow to the lane when both its ends are moved into
 * the lane together): they all move up to the pool. Returns the lane's
 * children (shapes and connections) that are not being deleted as well.
 */
export function survivorsOfLaneDelete<T extends Tree>(lane: T, deleting: readonly T[]): T[] {
  const gone = new Set<unknown>(deleting)
  return ((lane.children ?? []) as T[]).filter((child) => !gone.has(child))
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

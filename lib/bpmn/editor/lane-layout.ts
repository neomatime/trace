/**
 * Pool and lane geometry for horizontal pools. Pure: no DOM, no diagram-js,
 * so it is unit-tested under node. The editor's lane behaviour applies the
 * layouts with modeling commands (so they undo as one step).
 *
 * Model: a pool has a 30px name header on the left; its lanes are stacked
 * top to bottom across the rest (the "body"). Growing a lane pushes the lanes
 * (and pool-level steps) beyond it outwards and grows the pool, so steps
 * never end up in a different lane than the one they were placed in.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A direct child of a pool: a lane, or a step at pool level. */
export interface PoolItem {
  id: string
  kind: 'lane' | 'node'
  bounds: Rect
}

export interface PoolLayout {
  pool: Rect
  /** New bounds of every pool item, by id. */
  items: Record<string, Rect>
}

export const POOL_HEADER = 30
export const MIN_LANE_HEIGHT = 60
export const MIN_LANE_WIDTH = 120
export const DEFAULT_LANE_HEIGHT = 120
const bottom = (r: Rect) => r.y + r.height
const right = (r: Rect) => r.x + r.width
const midY = (r: Rect) => r.y + r.height / 2
const copy = (r: Rect): Rect => ({ x: r.x, y: r.y, width: r.width, height: r.height })

/** The part of a pool its lanes cover: everything right of the header. */
export function laneBody(pool: Rect): Rect {
  return { x: pool.x + POOL_HEADER, y: pool.y, width: pool.width - POOL_HEADER, height: pool.height }
}

/** Whether every rect lies inside `container`. */
export function fitsInside(container: Rect, rects: readonly Rect[], pad = 0): boolean {
  return rects.every(
    (r) =>
      r.x >= container.x + pad &&
      r.y >= container.y + pad &&
      right(r) <= right(container) - pad &&
      bottom(r) <= bottom(container) - pad,
  )
}

/** Items keep their place; lanes are made flush with the pool body horizontally. */
function flushLanes(pool: Rect, items: readonly PoolItem[], moved: Record<string, Rect>): Record<string, Rect> {
  const body = laneBody(pool)
  const result: Record<string, Rect> = {}
  for (const item of items) {
    const next = moved[item.id] ?? copy(item.bounds)
    result[item.id] = item.kind === 'lane' ? { ...next, x: body.x, width: body.width } : next
  }
  return result
}

/**
 * Layout after lane `laneId` was resized to `newBounds` (by hand or by
 * auto-grow): its width becomes every lane's width and the pool's body; a
 * change at its top or bottom edge pushes whatever lies beyond that edge.
 */
export function layoutAfterLaneResize(pool: Rect, items: readonly PoolItem[], laneId: string, newBounds: Rect): PoolLayout {
  const lane = items.find((item) => item.id === laneId)
  if (!lane) throw new Error(`"${laneId}" is not a lane of this pool`)
  const old = lane.bounds
  const dTop = newBounds.y - old.y
  const dBottom = bottom(newBounds) - bottom(old)
  const nextPool: Rect = {
    x: newBounds.x - POOL_HEADER,
    y: pool.y + dTop,
    width: newBounds.width + POOL_HEADER,
    height: pool.height + dBottom - dTop,
  }
  const moved: Record<string, Rect> = { [laneId]: copy(newBounds) }
  for (const item of items) {
    if (item.id === laneId) continue
    const centre = midY(item.bounds)
    const dy = centre < old.y ? dTop : centre > bottom(old) ? dBottom : 0
    moved[item.id] = { ...item.bounds, y: item.bounds.y + dy }
  }
  return { pool: nextPool, items: flushLanes(nextPool, items, moved) }
}

/**
 * Layout after the pool itself was resized: lanes stay flush with the body,
 * the top lane takes up a change at the top edge and the bottom lane one at
 * the bottom edge. Pool-level steps stay where they are.
 */
export function layoutAfterPoolResize(oldPool: Rect, newPool: Rect, items: readonly PoolItem[]): PoolLayout {
  const moved: Record<string, Rect> = {}
  for (const item of items) {
    if (item.kind !== 'lane') continue
    const next = copy(item.bounds)
    if (Math.abs(item.bounds.y - oldPool.y) < 1) {
      next.y = newPool.y
      next.height += oldPool.y - newPool.y
    }
    if (Math.abs(bottom(item.bounds) - bottom(oldPool)) < 1) next.height = bottom(newPool) - next.y
    moved[item.id] = next
  }
  return { pool: copy(newPool), items: flushLanes(newPool, items, moved) }
}

/**
 * Where a new lane goes. The first lane of a pool fills its body (the caller
 * moves the pool's steps into it). Otherwise it is inserted above or below
 * `referenceId` (or at the bottom of the pool when null), pushing everything
 * beyond it down and growing the pool.
 */
export function layoutForNewLane(
  pool: Rect,
  items: readonly PoolItem[],
  referenceId: string | null,
  where: 'above' | 'below',
  height = DEFAULT_LANE_HEIGHT,
): { layout: PoolLayout; lane: Rect } {
  const lanes = items.filter((item) => item.kind === 'lane')
  if (lanes.length === 0) {
    return { layout: { pool: copy(pool), items: flushLanes(pool, items, {}) }, lane: laneBody(pool) }
  }
  const reference = referenceId ? lanes.find((lane) => lane.id === referenceId) : undefined
  const insertY = reference ? (where === 'above' ? reference.bounds.y : bottom(reference.bounds)) : bottom(pool)
  const nextPool = { ...pool, height: pool.height + height }
  const moved: Record<string, Rect> = {}
  for (const item of items) {
    const shift = midY(item.bounds) > insertY ? height : 0
    moved[item.id] = { ...item.bounds, y: item.bounds.y + shift }
  }
  const body = laneBody(nextPool)
  return {
    layout: { pool: nextPool, items: flushLanes(nextPool, items, moved) },
    lane: { x: body.x, y: insertY, width: body.width, height },
  }
}

/**
 * Whether a layout keeps everything inside its frame: every lane at least the
 * minimum size and still around its own steps (`contents[laneId]`, in their
 * current place, since steps inside a lane move with it only when the lane is
 * pushed), and every pool-level step inside the pool body.
 */
export function layoutIsValid(
  layout: PoolLayout,
  items: readonly PoolItem[],
  contents: Readonly<Record<string, readonly Rect[]>>,
): boolean {
  if (layout.pool.width < MIN_LANE_WIDTH + POOL_HEADER || layout.pool.height < MIN_LANE_HEIGHT) return false
  const body = laneBody(layout.pool)
  for (const item of items) {
    const next = layout.items[item.id]
    if (!next) return false
    if (item.kind === 'node') {
      if (!fitsInside(body, [next])) return false
      continue
    }
    if (next.height < MIN_LANE_HEIGHT || next.width < MIN_LANE_WIDTH) return false
    const dy = next.y - item.bounds.y
    // A pushed lane (same height, moved) carries its steps along.
    const carried = dy !== 0 && next.height === item.bounds.height
    const steps = (contents[item.id] ?? []).map((s) => (carried ? { ...s, y: s.y + dy } : s))
    if (!fitsInside(next, steps)) return false
  }
  return true
}

/** A pool frame around existing content, with room for the header. Null when there is nothing. */
export function wrapBounds(contents: readonly Rect[]): Rect | null {
  if (contents.length === 0) return null
  const x = Math.min(...contents.map((r) => r.x))
  const y = Math.min(...contents.map((r) => r.y))
  const x2 = Math.max(...contents.map(right))
  const y2 = Math.max(...contents.map(bottom))
  const margin = 40
  return {
    x: x - margin - POOL_HEADER,
    y: y - margin,
    width: x2 - x + 2 * margin + POOL_HEADER,
    height: y2 - y + 2 * margin,
  }
}

/** Bounds for a new pool: under the lowest pool, aligned with it; else centred on `centre`. */
export function nextPoolBounds(
  pools: readonly Rect[],
  size: { width: number; height: number },
  centre: { x: number; y: number },
): Rect {
  if (pools.length === 0) {
    return { x: centre.x - size.width / 2, y: centre.y - size.height / 2, width: size.width, height: size.height }
  }
  const lowest = pools.reduce((a, b) => (bottom(b) > bottom(a) ? b : a))
  return { x: lowest.x, y: bottom(lowest) + 40, width: Math.max(size.width, lowest.width), height: size.height }
}

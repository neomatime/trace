/**
 * Adapters from canvas shapes (anything with bounds, type and children) to
 * the plain inputs of lane-layout.ts. Pure, no diagram-js imports.
 */

import { isFlowNodeKind, shapeKindOf } from './element-kinds.ts'
import type { PoolItem, Rect } from './lane-layout.ts'

export interface BoxEl extends Rect {
  id: string
  type?: string
  children?: BoxEl[]
  waypoints?: unknown[]
}

const isShape = (el: BoxEl) => !Array.isArray(el.waypoints)
export const rectOf = (el: Rect): Rect => ({ x: el.x, y: el.y, width: el.width, height: el.height })

/** The direct lanes and pool-level steps of a pool. */
export function lanePoolItems(pool: BoxEl): PoolItem[] {
  const items: PoolItem[] = []
  for (const child of pool.children ?? []) {
    if (!isShape(child)) continue
    const kind = shapeKindOf(child.type ?? '')
    if (kind === 'lane') items.push({ id: child.id, kind: 'lane', bounds: rectOf(child) })
    else if (isFlowNodeKind(kind)) items.push({ id: child.id, kind: 'node', bounds: rectOf(child) })
  }
  return items
}

/** For each lane of the pool: the bounds of everything drawn inside it (steps and child lanes). */
export function laneContents(pool: BoxEl): Record<string, Rect[]> {
  const result: Record<string, Rect[]> = {}
  for (const child of pool.children ?? []) {
    if (shapeKindOf(child.type ?? '') !== 'lane') continue
    result[child.id] = (child.children ?? []).filter(isShape).map(rectOf)
  }
  return result
}

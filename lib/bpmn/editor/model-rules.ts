/**
 * TRACE modelling rules as pure functions over a minimal element view
 * (diagram-js shapes, connections and roots all fit it). No diagram-js
 * imports, so they are unit-tested under node; `rules.ts` registers them.
 */

import { isFlowNodeKind, shapeKindOf } from './element-kinds.ts'

export interface El {
  id: string
  type?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  businessObject?: any
  parent?: El
  children?: El[]
  waypoints?: unknown[]
  incoming?: El[]
  outgoing?: El[]
  source?: El
  target?: El
}

export const kindOf = (el: El | undefined) => shapeKindOf(el?.type ?? '')
export const isConnection = (el: El) => Array.isArray(el.waypoints)
export const isRoot = (el: El | undefined) => !!el && !el.parent && !isConnection(el)

/** The pool an element sits in (itself for a pool), or undefined at root level. */
export function poolOf(el: El | undefined): El | undefined {
  let cursor = el
  while (cursor) {
    if (kindOf(cursor) === 'participant') return cursor
    cursor = cursor.parent
  }
  return undefined
}

export function hasLanes(el: El): boolean {
  return (el.children ?? []).some((child) => kindOf(child) === 'lane')
}

const flowsOf = (shape: El, type: string) =>
  [...(shape.incoming ?? []), ...(shape.outgoing ?? [])].filter((c) => c.type === type)

/** The element at the other end of `connection`, seen from `shape`. */
const otherEnd = (connection: El, shape: El) => (connection.source === shape ? connection.target : connection.source)

/**
 * Where a shape may be dropped (created or moved). Steps go into lanes
 * without child lanes, into pools that have a process (at pool level, also
 * when the pool has lanes: that is where a deleted lane's steps live), or
 * into a process-only diagram's root. Pools go on a collaboration root.
 * Lanes are never dropped: the lane commands place them.
 *
 * A step joined by sequence flows stays in its pool (sequence flows cannot
 * cross pools), and a move may not put both ends of one of its message flows
 * in the same pool (message flows join different pools only).
 */
export function canDrop(shape: El, target: El | undefined): boolean {
  if (!target) return false
  const kind = kindOf(shape)
  if (kind === 'participant') return isRoot(target) && target.type === 'bpmn:Collaboration'
  if (kind === 'lane') return false
  if (!isFlowNodeKind(kind)) return false

  const targetKind = kindOf(target)
  let allowed = false
  if (targetKind === 'lane') allowed = !hasLanes(target)
  else if (targetKind === 'participant') allowed = !!target.businessObject?.processRef
  else if (isRoot(target)) allowed = target.type === 'bpmn:Process'
  if (!allowed) return false
  if (!shape.parent) return true // a new shape has no flows yet

  const targetPool = poolOf(target)
  if (targetPool !== poolOf(shape) && flowsOf(shape, 'bpmn:SequenceFlow').length > 0) return false
  return flowsOf(shape, 'bpmn:MessageFlow').every((flow) => {
    const other = otherEnd(flow, shape)
    return !targetPool || poolOf(other) !== targetPool
  })
}

/** The connection type allowed between two elements, or false. */
export function connectionTypeBetween(source: El | undefined, target: El | undefined): string | false {
  if (!source || !target || source === target) return false
  const sourceKind = kindOf(source)
  const targetKind = kindOf(target)
  if (sourceKind === 'lane' || targetKind === 'lane') return false
  const sourcePool = poolOf(source)
  const targetPool = poolOf(target)

  if (isFlowNodeKind(sourceKind) && isFlowNodeKind(targetKind) && sourcePool === targetPool) {
    if (sourceKind === 'end-event' || targetKind === 'start-event') return false
    return 'bpmn:SequenceFlow'
  }
  if (sourcePool && targetPool && sourcePool !== targetPool) {
    if (sourceKind === 'exclusive-gateway' || targetKind === 'exclusive-gateway') return false
    if (sourceKind === 'start-event' || targetKind === 'end-event') return false
    return 'bpmn:MessageFlow'
  }
  return false
}

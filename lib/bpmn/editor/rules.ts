import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import { isFlowNodeKind, isResizableKind, shapeKindOf } from './element-kinds.ts'

/** Minimal element view the rules need (diagram-js shapes, connections and roots). */
interface El {
  id: string
  type?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  businessObject?: any
  parent?: El
  children?: El[]
  waypoints?: unknown[]
  incoming?: El[]
  outgoing?: El[]
}

const MIN_SIZE: Record<string, { width: number; height: number }> = {
  task: { width: 60, height: 40 },
  participant: { width: 300, height: 60 },
  unknown: { width: 60, height: 40 },
}

const kindOf = (el: El | undefined) => shapeKindOf(el?.type ?? '')
const isConnection = (el: El) => Array.isArray(el.waypoints)
const isRoot = (el: El | undefined) => !!el && !el.parent && !isConnection(el)

/** The pool an element sits in (itself for a pool), or undefined at root level. */
export function poolOf(el: El | undefined): El | undefined {
  let cursor = el
  while (cursor) {
    if (kindOf(cursor) === 'participant') return cursor
    cursor = cursor.parent
  }
  return undefined
}

function hasLanes(el: El): boolean {
  return (el.children ?? []).some((child) => kindOf(child) === 'lane')
}

/** Where a shape may be dropped (created or moved). */
function canDrop(shape: El, target: El | undefined): boolean {
  if (!target) return false
  const kind = kindOf(shape)
  if (kind === 'participant') {
    return isRoot(target) && target.type === 'bpmn:Collaboration'
  }
  if (kind === 'lane') return false // lane editing arrives with pool/lane behaviour (Task 12)
  if (!isFlowNodeKind(kind)) return false

  const targetKind = kindOf(target)
  let allowed = false
  if (targetKind === 'lane') allowed = !hasLanes(target)
  else if (targetKind === 'participant') allowed = !!target.businessObject?.processRef && !hasLanes(target)
  else if (isRoot(target)) allowed = target.type === 'bpmn:Process'
  if (!allowed) return false

  // a node with sequence flows must stay in its pool: flows cannot cross pools
  const flows = [...(shape.incoming ?? []), ...(shape.outgoing ?? [])].filter(
    (c) => c.type === 'bpmn:SequenceFlow',
  )
  return flows.length === 0 || !shape.parent || poolOf(target) === poolOf(shape)
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

/**
 * TRACE modelling rules for the Stage 1 element set: where shapes may be
 * placed, what may be resized, and which flow type joins two elements.
 */
export default class TraceRules extends RuleProvider {
  static $inject = ['eventBus']

  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  init(): void {
    this.addRule('shape.create', (context: { shape: El; target?: El }) =>
      canDrop(context.shape, context.target),
    )

    this.addRule('elements.move', (context: { shapes: El[]; target?: El }) => {
      const shapes = context.shapes.filter((s) => !isConnection(s))
      if (shapes.some((s) => kindOf(s) === 'lane')) return false
      if (!context.target) return true
      return shapes.every((shape) => canDrop(shape, context.target))
    })

    this.addRule('shape.resize', (context: { shape: El; newBounds?: { width: number; height: number } }) => {
      const kind = kindOf(context.shape)
      if (!isResizableKind(kind)) return false
      if (kind === 'participant' && hasLanes(context.shape)) return false // Task 12
      if (!context.newBounds) return true
      const min = MIN_SIZE[kind]
      return context.newBounds.width >= min.width && context.newBounds.height >= min.height
    })

    this.addRule('connection.create', (context: { source?: El; target?: El }) => {
      const type = connectionTypeBetween(context.source, context.target)
      return type ? { type } : false
    })

    this.addRule('connection.reconnect', (context: { connection: El; source?: El; target?: El }) => {
      const type = connectionTypeBetween(context.source, context.target)
      return type !== false && type === context.connection.type
    })
  }
}

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import { deletableElements } from './delete-policy.ts'
import { isResizableKind } from './element-kinds.ts'
import { lanePoolItems, laneContents, type BoxEl } from './lane-items.ts'
import { layoutAfterLaneResize, layoutAfterPoolResize, layoutIsValid, type Rect } from './lane-layout.ts'
import { canDrop, connectionTypeBetween, hasLanes, isConnection, kindOf, type El } from './model-rules.ts'

export { connectionTypeBetween, poolOf } from './model-rules.ts'

const MIN_SIZE: Record<string, { width: number; height: number }> = {
  task: { width: 60, height: 40 },
  participant: { width: 300, height: 60 },
  lane: { width: 120, height: 60 },
  unknown: { width: 60, height: 40 },
}

interface ShapeEl extends El, Rect {}

/** Whether resizing a lane, or a pool with lanes, to `newBounds` keeps every step inside its frame. */
function laneResizeAllowed(shape: ShapeEl, newBounds: Rect): boolean {
  const kind = kindOf(shape)
  const pool = (kind === 'lane' ? shape.parent : shape) as unknown as BoxEl | undefined
  if (!pool || kindOf(pool as El) !== 'participant') return false
  const items = lanePoolItems(pool)
  const layout =
    kind === 'lane' ? layoutAfterLaneResize(pool, items, shape.id, newBounds) : layoutAfterPoolResize(pool, newBounds, items)
  return layoutIsValid(layout, items, laneContents(pool))
}

/**
 * TRACE modelling rules for the Stage 1 element set: where shapes may be
 * placed, what may be resized, which flow type joins two elements and what
 * may be deleted. The rules themselves are pure (model-rules.ts,
 * lane-layout.ts, delete-policy.ts).
 */
export default class TraceRules extends RuleProvider {
  static $inject = ['eventBus']

  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  init(): void {
    this.addRule('shape.create', (context: { shape: El; target?: El }) => canDrop(context.shape, context.target))

    this.addRule('elements.move', (context: { shapes: El[]; target?: El }) => {
      const shapes = context.shapes.filter((s) => !isConnection(s))
      // Lanes are placed by the lane commands (add above/below, resize), never dragged.
      if (shapes.some((s) => kindOf(s) === 'lane')) return false
      if (!context.target) return true
      return shapes.every((shape) => canDrop(shape, context.target))
    })

    this.addRule('shape.resize', (context: { shape: ShapeEl; newBounds?: Rect }) => {
      const kind = kindOf(context.shape)
      if (!isResizableKind(kind)) return false
      if (kind === 'participant' && !context.shape.businessObject?.processRef) return true // collapsed pool
      if (!context.newBounds) return true
      const min = MIN_SIZE[kind]
      if (context.newBounds.width < min.width || context.newBounds.height < min.height) return false
      if (kind === 'lane' || (kind === 'participant' && hasLanes(context.shape))) {
        return laneResizeAllowed(context.shape, context.newBounds)
      }
      return true
    })

    this.addRule('connection.create', (context: { source?: El; target?: El; hints?: { targetParent?: El } }) => {
      // While a shape is being created and connected in one gesture (dragged
      // from the context pad) it has no parent yet: judge it where it will land.
      const parent = context.hints?.targetParent
      const target = context.target && !context.target.parent && parent ? { ...context.target, parent } : context.target
      const type = connectionTypeBetween(context.source, target)
      return type ? { type } : false
    })

    // One delete policy for the Delete key and the context pad. Deleting a
    // lane keeps its steps (lane-behaviour.ts moves them to the pool).
    this.addRule('elements.delete', (context: { elements: El[] }) => deletableElements(context.elements))

    this.addRule('connection.reconnect', (context: { connection: El; source?: El; target?: El }) => {
      const type = connectionTypeBetween(context.source, context.target)
      return type !== false && type === context.connection.type
    })
  }
}

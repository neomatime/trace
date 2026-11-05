import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor.js'
import type CommandStack from 'diagram-js/lib/command/CommandStack.js'
import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementFactory from 'diagram-js/lib/core/ElementFactory.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type Modeling from 'diagram-js/lib/features/modeling/Modeling.js'
import type { Element, Root, Shape } from 'diagram-js/lib/model/Types.js'
import type { ModdleElement } from 'bpmn-moddle'
import type BpmnDocument from './document.ts'
import { lanesAmong, survivorsOfLaneDelete } from './delete-policy.ts'
import { defaultSizeOf, isFlowNodeKind, shapeKindOf } from './element-kinds.ts'
import { lanePoolItems, rectOf, type BoxEl } from './lane-items.ts'
import {
  layoutAfterLaneResize,
  layoutAfterPoolResize,
  layoutForNewLane,
  nextPoolBounds,
  wrapBounds,
  type PoolItem,
  type PoolLayout,
  type Rect,
} from './lane-layout.ts'
import { applyRootSwap, revertRootSwap } from './pool-wrap.ts'

export const ADD_LANE = 'trace.lane.add'
export const WRAP_IN_POOL = 'trace.pool.wrap'

/** Hints for the follow-up commands a layout issues: no recursion, no auto-grow. */
const LAYOUT_HINTS = { autoResize: false, traceLayout: true } as const

const kindOf = (element: Element | undefined) => shapeKindOf(element?.type ?? '')
const isConnection = (element: Element) => Array.isArray((element as { waypoints?: unknown }).waypoints)
const hasLanes = (shape: Element) => ((shape as Shape).children ?? []).some((c) => kindOf(c) === 'lane')
const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Apply a pool layout with modeling commands: the pool is resized, pushed
 * lanes and pool-level steps are moved (a lane carries its steps), and lanes
 * are resized to their new size. `skip` is the shape the user already resized.
 */
function applyLayout(modeling: Modeling, pool: Shape, items: readonly PoolItem[], layout: PoolLayout, skip: string): void {
  if (pool.id !== skip && !sameRect(rectOf(pool), layout.pool)) {
    modeling.resizeShape(pool, layout.pool, null as never, LAYOUT_HINTS as never)
  }
  const byId = new Map((pool.children ?? []).map((c) => [c.id, c as Shape]))
  for (const item of items) {
    if (item.id === skip) continue
    const shape = byId.get(item.id)
    const target = layout.items[item.id]
    if (!shape || !target) continue
    const dy = target.y - item.bounds.y
    if (dy !== 0) modeling.moveElements([shape], { x: 0, y: dy }, pool, LAYOUT_HINTS as never)
    if (item.kind === 'lane' && !sameRect(rectOf(shape), target)) {
      modeling.resizeShape(shape, target, null as never, LAYOUT_HINTS as never)
    }
  }
}

/** Index just after the pool's lanes, so lanes are drawn beneath the steps. */
const laneInsertIndex = (pool: Shape) => (pool.children ?? []).filter((c) => kindOf(c) === 'lane').length

interface AddLaneContext {
  pool: Shape
  reference: Shape | null
  where: 'above' | 'below'
  lane?: Shape
}

/**
 * Adds a lane to a pool as one undoable step. The first lane fills the pool
 * and takes in its steps; later lanes are inserted above or below a lane,
 * pushing the rest down and growing the pool.
 */
class AddLaneHandler {
  static $inject = ['modeling', 'elementFactory']

  private readonly modeling: Modeling
  private readonly elementFactory: ElementFactory

  constructor(modeling: Modeling, elementFactory: ElementFactory) {
    this.modeling = modeling
    this.elementFactory = elementFactory
  }

  execute(): Element[] {
    return []
  }

  revert(): Element[] {
    return []
  }

  postExecute(context: AddLaneContext): void {
    const { pool, reference, where } = context
    const items = lanePoolItems(pool as unknown as BoxEl)
    const laneCount = items.filter((item) => item.kind === 'lane').length
    const { layout, lane: bounds } = layoutForNewLane(pool, items, reference?.id ?? null, where)
    const shape = this.elementFactory.createShape({ type: 'bpmn:Lane', name: `Lane ${laneCount + 1}` } as never) as Shape

    if (laneCount === 0) {
      const created = this.modeling.createShape(shape, bounds, pool, 0, LAYOUT_HINTS as never) as Shape
      const steps = (pool.children ?? []).filter((c) => !isConnection(c) && isFlowNodeKind(kindOf(c)))
      if (steps.length) this.modeling.moveElements(steps, { x: 0, y: 0 }, created, LAYOUT_HINTS as never)
      context.lane = created
      return
    }
    applyLayout(this.modeling, pool, items, layout, '')
    context.lane = this.modeling.createShape(shape, bounds, pool, laneInsertIndex(pool), LAYOUT_HINTS as never) as Shape
  }
}

interface WrapContext {
  collaboration: ModdleElement
  process: ModdleElement
  oldRoot?: Root
  newRoot?: Root
  moved?: Element[]
  pool?: Shape
}

/**
 * Turns a process-only diagram into a collaboration with one pool around
 * everything: swaps the canvas root (and the plane's semantic root), then
 * creates the pool for the existing process and moves the content into it.
 */
class WrapInPoolHandler {
  static $inject = ['canvas', 'elementFactory', 'modeling', 'bpmnDocument']

  private readonly canvas: Canvas
  private readonly elementFactory: ElementFactory
  private readonly modeling: Modeling
  private readonly document: BpmnDocument

  constructor(canvas: Canvas, elementFactory: ElementFactory, modeling: Modeling, document: BpmnDocument) {
    this.canvas = canvas
    this.elementFactory = elementFactory
    this.modeling = modeling
    this.document = document
  }

  execute(context: WrapContext): Element[] {
    const oldRoot = this.canvas.getRootElement() as Root
    context.oldRoot = oldRoot
    context.newRoot ??= this.elementFactory.createRoot({
      id: context.collaboration.id,
      type: 'bpmn:Collaboration',
      businessObject: context.collaboration,
    } as never) as Root
    const moved = this.reparent(oldRoot, context.newRoot)
    this.canvas.setRootElement(context.newRoot)
    applyRootSwap(this.definitions(), context.collaboration)
    return moved
  }

  revert(context: WrapContext): Element[] {
    const { oldRoot, newRoot } = context
    if (!oldRoot || !newRoot) return []
    const moved = this.reparent(newRoot, oldRoot)
    this.canvas.setRootElement(oldRoot)
    revertRootSwap(this.definitions(), context.collaboration, context.process)
    return moved
  }

  postExecute(context: WrapContext): void {
    const root = context.newRoot as Root
    const content = ((root.children ?? []) as Element[]).filter((c) => !isConnection(c)) as Shape[]
    const size = defaultSizeOf('bpmn:Participant')
    const box = this.canvas.viewbox()
    const bounds =
      wrapBounds(content.map(rectOf)) ??
      nextPoolBounds([], size, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    const participant = this.document.moddle.create('bpmn:Participant', {
      id: this.document.nextId('bpmn:Participant'),
      name: context.process.name ?? 'Process',
      processRef: context.process,
    })
    const pool = this.elementFactory.createShape({ type: 'bpmn:Participant', businessObject: participant } as never) as Shape
    context.pool = this.modeling.createShape(pool, bounds, root as never, LAYOUT_HINTS as never) as Shape
    if (content.length) this.modeling.moveElements(content, { x: 0, y: 0 }, context.pool, LAYOUT_HINTS as never)
  }

  private definitions(): ModdleElement {
    const definitions = this.document.definitions
    if (!definitions) throw new Error('Nothing has been imported yet')
    return definitions
  }

  /** Move every child of `from` under `to` (graphics follow via elements.changed). */
  private reparent(from: Root, to: Root): Element[] {
    const children = [...((from.children ?? []) as Element[])]
    for (const child of children) {
      child.parent = to as never
      ;(to.children as Element[]).push(child)
    }
    ;(from.children as Element[]).length = 0
    return children
  }
}

/**
 * Pool and lane behaviour:
 * - deleting a lane keeps its steps: they move up to the pool first (one
 *   policy for the Delete key and the context pad, both of which run
 *   `elements.delete`);
 * - resizing a lane (by hand or by auto-grow) pushes neighbouring lanes and
 *   grows the pool; resizing a pool stretches its edge lanes (lane-layout.ts);
 * - lane and pool commands for the palette and the context pad.
 */
export default class TraceLaneBehaviour extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling', 'commandStack', 'canvas', 'elementRegistry', 'elementFactory', 'bpmnDocument']

  private readonly commandStack: CommandStack
  private readonly canvasService: Canvas
  private readonly registry: { getAll(): Element[] }
  private readonly factory: ElementFactory
  private readonly modelingService: Modeling
  private readonly document: BpmnDocument

  constructor(
    eventBus: EventBus,
    modeling: Modeling,
    commandStack: CommandStack,
    canvas: Canvas,
    elementRegistry: { getAll(): Element[] },
    elementFactory: ElementFactory,
    document: BpmnDocument,
  ) {
    super(eventBus)
    this.commandStack = commandStack
    this.canvasService = canvas
    this.registry = elementRegistry
    this.factory = elementFactory
    this.modelingService = modeling
    this.document = document
    commandStack.registerHandler(ADD_LANE, AddLaneHandler as never)
    commandStack.registerHandler(WRAP_IN_POOL, WrapInPoolHandler as never)

    this.preExecute('elements.delete', (event: { context: { elements: Element[] } }) => {
      const deleting = event.context.elements
      for (const lane of lanesAmong(deleting)) {
        const pool = lane.parent as Shape | undefined
        if (!pool) continue
        const survivors = survivorsOfLaneDelete(lane as never, deleting as never) as Shape[]
        if (survivors.length) modeling.moveElements(survivors, { x: 0, y: 0 }, pool, LAYOUT_HINTS as never)
      }
    })

    this.postExecuted(
      'shape.resize',
      (event: { context: { shape: Shape; oldBounds: Rect; newBounds: Rect; hints?: { traceLayout?: boolean } } }) => {
        const { shape, oldBounds, newBounds, hints } = event.context
        if (hints?.traceLayout) return
        const kind = kindOf(shape)
        if (kind === 'lane') {
          const pool = shape.parent as Shape | undefined
          if (!pool || kindOf(pool) !== 'participant') return
          const items = lanePoolItems(pool as unknown as BoxEl).map((item) =>
            item.id === shape.id ? { ...item, bounds: { ...oldBounds } } : item,
          )
          applyLayout(modeling, pool, items, layoutAfterLaneResize(pool, items, shape.id, newBounds), shape.id)
        } else if (kind === 'participant' && hasLanes(shape)) {
          const items = lanePoolItems(shape as unknown as BoxEl)
          applyLayout(modeling, shape, items, layoutAfterPoolResize(oldBounds, newBounds, items), shape.id)
        }
      },
    )
  }

  /** Add a lane to `target` (a pool, or a lane to add next to). Returns the new lane. */
  addLane(target: Shape, where: 'above' | 'below' = 'below'): Shape | null {
    const isLane = kindOf(target) === 'lane'
    const pool = (isLane ? target.parent : target) as Shape | undefined
    if (!pool || kindOf(pool) !== 'participant' || !pool.businessObject?.processRef) return null
    const context: AddLaneContext = { pool, reference: isLane ? target : null, where }
    this.commandStack.execute(ADD_LANE, context as never)
    return context.lane ?? null
  }

  /**
   * Add a pool. On a collaboration it goes under the lowest pool (or at
   * `centre` on an empty canvas) with a new process; on a process-only
   * diagram it wraps the existing steps. Returns the new pool.
   */
  addPool(centre: { x: number; y: number }): Shape | null {
    const root = this.canvasService.getRootElement() as Root
    const rootBo = root.businessObject as ModdleElement | undefined
    if (rootBo?.$type === 'bpmn:Process') {
      const collaboration = this.document.moddle.create('bpmn:Collaboration', {
        id: this.document.nextId('bpmn:Collaboration'),
        participants: [],
      })
      const context: WrapContext = { collaboration, process: rootBo }
      this.commandStack.execute(WRAP_IN_POOL, context as never)
      return context.pool ?? null
    }
    if (rootBo?.$type !== 'bpmn:Collaboration') return null
    const pools = this.registry
      .getAll()
      .filter((e) => e.parent === root && kindOf(e) === 'participant')
      .map((e) => rectOf(e as Shape))
    const shape = this.factory.createShape({ type: 'bpmn:Participant', name: 'Process' } as never) as Shape
    const bounds = nextPoolBounds(pools, shape, centre)
    return this.modelingService.createShape(shape, bounds, root as never) as Shape
  }
}

/** The pool to add a lane to: the selected pool or lane's pool, else the only (or first) pool with a process. */
export function poolForLane(selected: Element | undefined, all: readonly Element[]): Shape | undefined {
  let cursor: Element | undefined = selected
  while (cursor) {
    if (kindOf(cursor) === 'participant' && cursor.businessObject?.processRef) return cursor as Shape
    cursor = cursor.parent
  }
  return all.find((e) => kindOf(e) === 'participant' && e.businessObject?.processRef) as Shape | undefined
}

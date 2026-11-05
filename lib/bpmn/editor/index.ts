import Diagram from 'diagram-js'
import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type ElementFactory from 'diagram-js/lib/core/ElementFactory.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type CommandStack from 'diagram-js/lib/command/CommandStack.js'
import type Overlays from 'diagram-js/lib/features/overlays/Overlays.js'
import type ZoomScroll from 'diagram-js/lib/navigation/zoomscroll/ZoomScroll.js'
import type Create from 'diagram-js/lib/features/create/Create.js'
import type Modeling from 'diagram-js/lib/features/modeling/Modeling.js'
import type Rules from 'diagram-js/lib/features/rules/Rules.js'
import type Selection from 'diagram-js/lib/features/selection/Selection.js'
import type { Connection, Element, Shape } from 'diagram-js/lib/model/Types.js'
import AutoResizeModule from 'diagram-js/lib/features/auto-resize/index.js'
import BendpointsModule from 'diagram-js/lib/features/bendpoints/index.js'
import ConnectModule from 'diagram-js/lib/features/connect/index.js'
import CreateModule from 'diagram-js/lib/features/create/index.js'
import EditorActionsModule from 'diagram-js/lib/features/editor-actions/index.js'
import KeyboardModule from 'diagram-js/lib/features/keyboard/index.js'
import KeyboardMoveSelectionModule from 'diagram-js/lib/features/keyboard-move-selection/index.js'
import ModelingModule from 'diagram-js/lib/features/modeling/index.js'
import MoveModule from 'diagram-js/lib/features/move/index.js'
import OutlineModule from 'diagram-js/lib/features/outline/index.js'
import OverlaysModule from 'diagram-js/lib/features/overlays/index.js'
import ResizeModule from 'diagram-js/lib/features/resize/index.js'
import SelectionModule from 'diagram-js/lib/features/selection/index.js'
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas/index.js'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll/index.js'
import type { ModdleElement } from 'bpmn-moddle'
import type { EntityId } from '../../../types/common.ts'
import type { AuditFields } from '../../../types/process-flow.ts'
import { readAuditFields } from '../graph.ts'
import TraceCommands, { UPDATE_AUDIT_FIELDS } from './audit-command.ts'
import TraceAutoResizeProvider from './auto-resize.ts'
import TraceConnectionParentBehaviour from './behaviours.ts'
import { planDiagram } from './diagram-plan.ts'
import BpmnDocument from './document.ts'
import TraceElementFactory from './element-factory.ts'
import { findElementByName } from './element-search.ts'
import { isFlowNodeKind, shapeKindOf } from './element-kinds.ts'
import TraceKeyboardBindings from './keyboard.ts'
import TraceLaneBehaviour, { poolForLane } from './lane-behaviour.ts'
import TraceLayouter from './layouter.ts'
import { CanvasMarkers } from './markers.ts'
import { findAppendPosition } from './placement.ts'
import TraceRenderer from './renderer.ts'
import TraceRules from './rules.ts'
import { syncDefinitions, type DiagramSnapshot } from './semantic-sync.ts'
import type { EditorModule, ProcessEditor, ProcessEditorOptions } from './types.ts'

export type { CompareState, ElementInfo, EditorModule, ProcessEditor, ProcessEditorOptions } from './types.ts'
export { traceContextPadModule } from './context-pad.ts'

/** TRACE BPMN core: semantic document, BPMN element factory and renderer. */
export const traceCoreModule: EditorModule = {
  __init__: ['traceRenderer'],
  bpmnDocument: ['type', BpmnDocument],
  elementFactory: ['type', TraceElementFactory],
  traceRenderer: ['type', TraceRenderer],
}

/** TRACE editing: rules, layout, connection parenting, pools and lanes, audit commands. */
export const traceModelingModule: EditorModule = {
  __depends__: [ModelingModule],
  __init__: ['traceRules', 'traceConnectionParentBehaviour', 'traceCommands', 'traceLaneBehaviour'],
  traceRules: ['type', TraceRules],
  traceConnectionParentBehaviour: ['type', TraceConnectionParentBehaviour],
  traceCommands: ['type', TraceCommands],
  traceLaneBehaviour: ['type', TraceLaneBehaviour],
  layouter: ['type', TraceLayouter],
  connectionDocking: ['type', CroppingConnectionDocking],
}

/**
 * Modules for a read-only canvas: render, select, pan, zoom, outlines and
 * overlays (issue badges). No command stack, so nothing can change.
 */
export const VIEWER_MODULES: readonly EditorModule[] = [
  traceCoreModule,
  SelectionModule,
  OutlineModule,
  OverlaysModule,
  MoveCanvasModule,
  ZoomScrollModule,
]

/**
 * Modules for editing. The context pad is deliberately absent: callers plug
 * it in through `ProcessEditorOptions.additionalModules`
 * (`traceContextPadModule`). The palette is a React component that drives
 * `ProcessEditor.addElement` / `startCreate`.
 */
export const MODELER_MODULES: readonly EditorModule[] = [
  ...VIEWER_MODULES,
  traceModelingModule,
  MoveModule,
  ResizeModule,
  CreateModule,
  ConnectModule,
  BendpointsModule,
  EditorActionsModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  AutoResizeModule,
  {
    // Ctrl/Cmd+0 fits; pools and lanes grow to fit new steps (Task 12: lanes too).
    __init__: ['traceKeyboardBindings', 'traceAutoResizeProvider'],
    traceKeyboardBindings: ['type', TraceKeyboardBindings],
    traceAutoResizeProvider: ['type', TraceAutoResizeProvider],
  },
]

const isRoot = (element: Element) => !element.parent
const isConnection = (element: Element): element is Connection => Array.isArray((element as Connection).waypoints)

/** Centre of a shape, or the middle waypoint of a connection. */
function midOf(element: Element): { x: number; y: number } {
  if (isConnection(element)) {
    const points = element.waypoints
    const a = points[Math.floor((points.length - 1) / 2)]
    const b = points[Math.ceil((points.length - 1) / 2)]
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  const shape = element as Shape
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }
}

const contains = (shape: Shape, point: { x: number; y: number }) =>
  point.x >= shape.x && point.x <= shape.x + shape.width && point.y >= shape.y && point.y <= shape.y + shape.height

function snapshotOf(registry: ElementRegistry): DiagramSnapshot {
  const shapes: DiagramSnapshot['shapes'][number][] = []
  const connections: DiagramSnapshot['connections'][number][] = []
  for (const element of registry.getAll() as Element[]) {
    if (isRoot(element) || !element.businessObject) continue
    const parentId = element.parent && !isRoot(element.parent) ? element.parent.id : null
    if (isConnection(element)) {
      if (!element.source || !element.target) continue
      connections.push({
        id: element.id,
        type: element.type,
        businessObject: element.businessObject,
        di: element.di,
        parentId,
        sourceId: element.source.id,
        targetId: element.target.id,
        waypoints: element.waypoints.map((p) => ({ x: p.x, y: p.y })),
      })
    } else {
      const shape = element as Shape
      shapes.push({
        id: shape.id,
        type: shape.type,
        businessObject: shape.businessObject,
        di: shape.di,
        parentId,
        bounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
      })
    }
  }
  return { shapes, connections }
}

export function createProcessEditor(container: HTMLElement, options: ProcessEditorOptions): ProcessEditor {
  const modules = options.readOnly
    ? [...VIEWER_MODULES]
    : [...MODELER_MODULES, ...(options.additionalModules ?? [])]

  const diagram = new Diagram({
    canvas: { container },
    keyboard: { bind: !options.readOnly },
    modules: modules as never,
  })

  const get = <T>(name: string): T => diagram.get(name) as T
  const canvas = get<Canvas>('canvas')
  const registry = get<ElementRegistry>('elementRegistry')
  const factory = get<ElementFactory>('elementFactory')
  const eventBus = get<EventBus>('eventBus')
  const document = get<BpmnDocument>('bpmnDocument')
  const zoomScroll = get<ZoomScroll>('zoomScroll')
  const commandStack = options.readOnly ? null : get<CommandStack>('commandStack')
  const markers = new CanvasMarkers(canvas, registry, get<Overlays>('overlays'))
  const selection = get<Selection>('selection')
  const modeling = options.readOnly ? null : get<Modeling>('modeling')
  const create = options.readOnly ? null : get<Create>('create')
  const rules = options.readOnly ? null : get<Rules>('rules')
  const lanes = options.readOnly ? null : get<TraceLaneBehaviour>('traceLaneBehaviour')
  let destroyed = false

  const elementOrThrow = (id: EntityId): Element => {
    const element = registry.get(id) as Element | undefined
    if (!element || !element.businessObject) throw new Error(`Element "${id}" is not on the canvas`)
    return element
  }

  const viewCentre = () => {
    const box = canvas.viewbox()
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }
  const addPool = () => lanes?.addPool(viewCentre()) ?? null
  /** A lane next to the selected lane, else at the bottom of the selected (or only) pool; adds a pool first if none. */
  const addLane = () => {
    if (!lanes) return null
    const selected = selection.get() as Element[]
    const current = selected.length === 1 ? selected[0] : undefined
    if (current && current.type === 'bpmn:Lane') return lanes.addLane(current as Shape, 'below')
    const pool = poolForLane(current, registry.getAll() as Element[]) ?? addPool()
    return pool ? lanes.addLane(pool, 'below') : null
  }

  const editor: ProcessEditor = {
    async importXml(xml) {
      const { rootElement } = await document.moddle.fromXML(xml)
      if (!rootElement || rootElement.$type !== 'bpmn:Definitions') {
        throw new Error('The document is not a BPMN definitions file')
      }
      const plan = planDiagram(rootElement)
      if (destroyed) return

      diagram.clear()
      markers.reset()
      const root = factory.createRoot({
        id: plan.root.id,
        type: plan.root.type,
        businessObject: plan.root.businessObject,
      } as never)
      canvas.setRootElement(root)

      const byId = new Map<string, Element>([[root.id, root as Element]])
      const parentOf = (id: string | null) => (id ? (byId.get(id) ?? root) : root)
      for (const s of plan.shapes) {
        const shape = factory.createShape({
          id: s.id,
          type: s.type,
          businessObject: s.businessObject,
          di: s.di,
          ...s.bounds,
        } as never)
        canvas.addShape(shape, parentOf(s.parentId) as Shape)
        byId.set(s.id, shape as Element)
      }
      for (const c of plan.connections) {
        const connection = factory.createConnection({
          id: c.id,
          type: c.type,
          businessObject: c.businessObject,
          di: c.di,
          source: byId.get(c.sourceId),
          target: byId.get(c.targetId),
          waypoints: c.waypoints,
        } as never)
        canvas.addConnection(connection, parentOf(c.parentId) as Shape)
      }
      document.definitions = rootElement
      for (const warning of plan.warnings) console.warn(`[bpmn-editor] ${warning}`)
      editor.fit()
    },

    async exportXml() {
      const definitions = document.definitions
      if (!definitions) throw new Error('Nothing has been imported yet')
      const { warnings } = syncDefinitions(document.moddle, definitions, snapshotOf(registry))
      for (const warning of warnings) console.warn(`[bpmn-editor] ${warning}`)
      const { xml } = await document.moddle.toXML(definitions, { format: true })
      return xml
    },

    onSelection(cb) {
      const listener = (event: { newSelection: Element[] }) => {
        const selected = event.newSelection.filter((e) => !isRoot(e))
        cb(selected.length === 1 ? selected[0].id : null)
      }
      eventBus.on('selection.changed', listener as never)
      return () => eventBus.off('selection.changed', listener as never)
    },

    onChange(cb) {
      const listener = () => cb()
      eventBus.on('commandStack.changed', listener)
      return () => eventBus.off('commandStack.changed', listener)
    },

    getAuditFields(elementId) {
      return readAuditFields(elementOrThrow(elementId).businessObject as ModdleElement)
    },

    setAuditFields(elementId, fields: AuditFields) {
      if (!commandStack) throw new Error('The diagram is read-only')
      commandStack.execute(UPDATE_AUDIT_FIELDS, { element: elementOrThrow(elementId), fields })
    },

    getElementInfo(elementId) {
      const element = registry.get(elementId) as Element | undefined
      if (!element || isRoot(element) || !element.businessObject) return null
      const bo = element.businessObject as { name?: string; $type: string }
      let lane: Element | undefined = element.parent
      while (lane && lane.businessObject?.$type !== 'bpmn:Lane') lane = lane.parent
      const laneName = (lane?.businessObject as { name?: string } | undefined)?.name
      return { name: bo.name ?? '', bpmnType: bo.$type, ...(laneName ? { laneName } : {}) }
    },

    setCompareStates(states) {
      markers.setCompareStates(states)
    },

    setIssues(issues) {
      markers.setIssues(issues)
    },

    fit() {
      if (registry.getAll().length > 1) canvas.zoom('fit-viewport', 'auto' as never)
    },

    undo() {
      commandStack?.undo()
    },

    redo() {
      commandStack?.redo()
    },

    zoomBy(delta) {
      zoomScroll.stepZoom(delta)
    },

    destroy() {
      if (destroyed) return
      destroyed = true
      diagram.destroy()
    },

    canUndo() {
      return commandStack?.canUndo() ?? false
    },

    canRedo() {
      return commandStack?.canRedo() ?? false
    },

    selectElement(elementId) {
      const element = registry.get(elementId) as Element | undefined
      if (!element || isRoot(element)) return false
      selection.select(element)
      const box = canvas.viewbox()
      const mid = midOf(element)
      canvas.viewbox({ x: mid.x - box.width / 2, y: mid.y - box.height / 2, width: box.width, height: box.height })
      return true
    },

    findElement(query) {
      const candidates = (registry.getAll() as Element[])
        .filter((e) => !isRoot(e) && e.businessObject)
        .map((e) => ({ id: e.id, name: e.businessObject.name as string | undefined }))
      return findElementByName(candidates, query)
    },

    startCreate(bpmnType, event) {
      if (!create) return
      const rootType = (canvas.getRootElement() as Element).businessObject?.$type
      // Lanes are placed by the lane layout, and a pool on a process-only
      // diagram wraps it: both are added in one go rather than dragged.
      if (bpmnType === 'bpmn:Lane' || (bpmnType === 'bpmn:Participant' && rootType !== 'bpmn:Collaboration')) {
        editor.addElement(bpmnType)
        return
      }
      create.start(event, factory.createShape({ type: bpmnType } as never) as never)
    },

    addElement(bpmnType) {
      if (!modeling || !rules || !lanes) return null
      if (bpmnType === 'bpmn:Participant' || bpmnType === 'bpmn:Lane') {
        const created = bpmnType === 'bpmn:Participant' ? addPool() : addLane()
        if (!created) return null
        selection.select(created)
        canvas.scrollToElement(created as never)
        canvas.focus()
        return created.id
      }
      const shape = factory.createShape({ type: bpmnType } as never) as Shape
      const allowedIn = (target: Element) => rules.allowed('shape.create', { shape, target }) === true
      const box = canvas.viewbox()
      let centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

      // Deepest container under the view centre that accepts the shape,
      // else the root process, else the first lane or pool that does.
      const containers = (registry.getAll() as Element[]).filter(
        (e) => !isRoot(e) && !isConnection(e) && allowedIn(e),
      ) as Shape[]
      const root = canvas.getRootElement() as Element
      let target: Element | undefined = containers.filter((c) => contains(c, centre)).pop()
      if (!target && allowedIn(root)) target = root
      if (!target && containers.length) {
        target = containers[0]
        centre = midOf(target)
      }
      if (!target) return null

      const area = target === root ? undefined : (target as Shape)
      const obstacles = (registry.getAll() as Element[])
        .filter((e) => !isRoot(e) && !isConnection(e) && isFlowNodeKind(shapeKindOf(e.type)))
        .map((e) => ({ x: (e as Shape).x, y: (e as Shape).y, width: (e as Shape).width, height: (e as Shape).height }))
      // A zero-width "source" just left of the centre: the first slot tried is the centre itself.
      const gap = 50
      const position = findAppendPosition({
        source: { x: centre.x - shape.width / 2 - gap, y: centre.y - shape.height / 2, width: 0, height: shape.height },
        size: shape,
        obstacles,
        container: area ? { x: area.x, y: area.y, width: area.width, height: area.height } : undefined,
        gap,
      })
      const created = modeling.createShape(shape, position, target as Shape)
      selection.select(created)
      canvas.focus() // so Delete and Ctrl/Cmd+Z apply straight away
      return created.id
    },
  }

  return editor
}

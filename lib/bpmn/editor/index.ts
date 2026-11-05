import Diagram from 'diagram-js'
import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type ElementFactory from 'diagram-js/lib/core/ElementFactory.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type CommandStack from 'diagram-js/lib/command/CommandStack.js'
import type Overlays from 'diagram-js/lib/features/overlays/Overlays.js'
import type ZoomScroll from 'diagram-js/lib/navigation/zoomscroll/ZoomScroll.js'
import type { Connection, Element, Shape } from 'diagram-js/lib/model/Types.js'
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
import TraceConnectionParentBehaviour from './behaviours.ts'
import { planDiagram } from './diagram-plan.ts'
import BpmnDocument from './document.ts'
import TraceElementFactory from './element-factory.ts'
import TraceLayouter from './layouter.ts'
import { CanvasMarkers } from './markers.ts'
import TraceRenderer from './renderer.ts'
import TraceRules from './rules.ts'
import { syncDefinitions, type DiagramSnapshot } from './semantic-sync.ts'
import type { EditorModule, ProcessEditor, ProcessEditorOptions } from './types.ts'

export type { CompareState, EditorModule, ProcessEditor, ProcessEditorOptions } from './types.ts'

/** TRACE BPMN core: semantic document, BPMN element factory and renderer. */
export const traceCoreModule: EditorModule = {
  __init__: ['traceRenderer'],
  bpmnDocument: ['type', BpmnDocument],
  elementFactory: ['type', TraceElementFactory],
  traceRenderer: ['type', TraceRenderer],
}

/** TRACE editing: rules, layout, connection parenting and audit commands. */
export const traceModelingModule: EditorModule = {
  __depends__: [ModelingModule],
  __init__: ['traceRules', 'traceConnectionParentBehaviour', 'traceCommands'],
  traceRules: ['type', TraceRules],
  traceConnectionParentBehaviour: ['type', TraceConnectionParentBehaviour],
  traceCommands: ['type', TraceCommands],
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
 * Modules for editing. Palette and context pad are deliberately absent:
 * Task 10 plugs them in through `ProcessEditorOptions.additionalModules`.
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
]

const isRoot = (element: Element) => !element.parent
const isConnection = (element: Element): element is Connection => Array.isArray((element as Connection).waypoints)

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
  let destroyed = false

  const elementOrThrow = (id: EntityId): Element => {
    const element = registry.get(id) as Element | undefined
    if (!element || !element.businessObject) throw new Error(`Element "${id}" is not on the canvas`)
    return element
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
  }

  return editor
}

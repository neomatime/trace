import ContextPadModule from 'diagram-js/lib/features/context-pad/index.js'
import type ContextPad from 'diagram-js/lib/features/context-pad/ContextPad.js'
import type { ContextPadEntries, ContextPadEntry } from 'diagram-js/lib/features/context-pad/ContextPadProvider.js'
import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type ElementFactory from 'diagram-js/lib/core/ElementFactory.js'
import type Connect from 'diagram-js/lib/features/connect/Connect.js'
import type Create from 'diagram-js/lib/features/create/Create.js'
import type Modeling from 'diagram-js/lib/features/modeling/Modeling.js'
import type Rules from 'diagram-js/lib/features/rules/Rules.js'
import type Selection from 'diagram-js/lib/features/selection/Selection.js'
import type { Element, Shape } from 'diagram-js/lib/model/Types.js'
import { resolveDeletable } from './delete-policy.ts'
import { isFlowNodeKind, shapeKindOf } from './element-kinds.ts'
import { iconSvg, type PadIcon } from './icons.ts'
import { findAppendPosition, type Rect } from './placement.ts'
import type TraceLaneBehaviour from './lane-behaviour.ts'
import { poolOf } from './rules.ts'
import type { EditorModule } from './types.ts'

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A keyboard-reachable button: icon plus a hover/focus label bubble. */
function entryHtml(icon: PadIcon, label: string, extraClass = ''): string {
  const text = escapeHtml(label)
  return (
    `<button type="button" class="entry trace-pad-entry ${extraClass}" draggable="true" aria-label="${text}">` +
    `${iconSvg(icon)}<span class="trace-pad-label" aria-hidden="true">${text}</span></button>`
  )
}

const isConnection = (element: Element) => Array.isArray((element as { waypoints?: unknown }).waypoints)
const kindOf = (element: Element | undefined) => shapeKindOf(element?.type ?? '')
const rectOf = (shape: Shape): Rect => ({ x: shape.x, y: shape.y, width: shape.width, height: shape.height })

interface AppendChoice {
  key: string
  bpmnType: string
  label: string
  icon: PadIcon
}

const APPEND_CHOICES: readonly AppendChoice[] = [
  { key: 'append.task', bpmnType: 'bpmn:Task', label: 'Add next step', icon: 'task' },
  { key: 'append.decision', bpmnType: 'bpmn:ExclusiveGateway', label: 'Add decision', icon: 'exclusive-gateway' },
  { key: 'append.end', bpmnType: 'bpmn:EndEvent', label: 'Add end', icon: 'end-event' },
]

/**
 * Quick-add on the selected element: "Add next step", "Add decision",
 * "Add end" (click to append to the right and connect in one go, or drag to
 * drop it anywhere, still connected), "Connect to..." and "Delete".
 * A lane offers "Add lane above" / "Add lane below" and "Delete" (its steps
 * stay, at pool level); a pool offers "Add lane", "Connect to..." (message
 * flows) and "Delete".
 */
export class TraceContextPadProvider {
  static $inject = [
    'contextPad',
    'modeling',
    'elementFactory',
    'create',
    'connect',
    'canvas',
    'elementRegistry',
    'selection',
    'rules',
    'traceLaneBehaviour',
  ]

  private readonly modeling: Modeling
  private readonly elementFactory: ElementFactory
  private readonly create: Create
  private readonly connect: Connect
  private readonly canvas: Canvas
  private readonly registry: ElementRegistry
  private readonly selection: Selection
  private readonly rules: Rules
  private readonly lanes: TraceLaneBehaviour

  constructor(
    contextPad: ContextPad,
    modeling: Modeling,
    elementFactory: ElementFactory,
    create: Create,
    connect: Connect,
    canvas: Canvas,
    registry: ElementRegistry,
    selection: Selection,
    rules: Rules,
    lanes: TraceLaneBehaviour,
  ) {
    this.modeling = modeling
    this.elementFactory = elementFactory
    this.create = create
    this.connect = connect
    this.canvas = canvas
    this.registry = registry
    this.selection = selection
    this.rules = rules
    this.lanes = lanes
    contextPad.registerProvider(this)
  }

  getContextPadEntries(element: Element): ContextPadEntries {
    if (isConnection(element)) return this.deleteEntries([element])
    const kind = kindOf(element)
    if (kind === 'lane') {
      return {
        'lane.above': this.laneEntry(element as Shape, 'above', 'lane-above', 'Add lane above'),
        'lane.below': this.laneEntry(element as Shape, 'below', 'lane-below', 'Add lane below'),
        ...this.deleteEntries([element]),
      }
    }
    if (kind === 'participant') {
      const entries: ContextPadEntries = {}
      if (element.businessObject?.processRef) {
        entries['lane.add'] = this.laneEntry(element as Shape, 'below', 'lane', 'Add lane')
      }
      return { ...entries, connect: this.connectEntry(element as Shape), ...this.deleteEntries([element]) }
    }
    if (!isFlowNodeKind(kind)) return this.deleteEntries([element])

    const entries: ContextPadEntries = {}
    if (kind !== 'end-event') {
      for (const choice of APPEND_CHOICES) entries[choice.key] = this.appendEntry(element as Shape, choice)
      entries.connect = this.connectEntry(element as Shape)
    }
    return { ...entries, ...this.deleteEntries([element]) }
  }

  private connectEntry(element: Shape): ContextPadEntry {
    return {
      group: 'connect',
      html: entryHtml('connect', 'Connect to…'),
      title: 'Connect to… (click, then click the step to connect to)',
      action: {
        // diagram-js accepts (event, start, autoActivate); its typings only list the point overload
        click: (event: Event) => this.connect.start(event as MouseEvent, element, true as never),
        dragstart: (event: Event) => this.connect.start(event as MouseEvent, element),
      },
    }
  }

  private laneEntry(target: Shape, where: 'above' | 'below', icon: PadIcon, label: string): ContextPadEntry {
    return {
      group: 'append',
      html: entryHtml(icon, label),
      title: label,
      action: {
        click: () => {
          const lane = this.lanes.addLane(target, where)
          if (lane) this.selection.select(lane)
          this.canvas.focus()
        },
      },
    }
  }

  getMultiElementContextPadEntries(elements: Element[]): ContextPadEntries {
    return this.deleteEntries(elements)
  }

  /** Append a new flow node to `source`, positioned and connected. Returns it. */
  append(source: Shape, bpmnType: string): Shape {
    const shape = this.elementFactory.createShape({ type: bpmnType } as never) as Shape
    const parent = source.parent as Shape
    const pool = poolOf(source as never)
    const obstacles = (this.registry.getAll() as Element[])
      .filter((e) => !isConnection(e) && e.parent && e !== source && isFlowNodeKind(kindOf(e)))
      .filter((e) => poolOf(e as never) === pool)
      .map((e) => rectOf(e as Shape))
    const parentKind = kindOf(parent)
    // Stay inside the source's lane vertically; past its right edge the lane
    // (and with it the pool) grows to take the new step (auto-resize).
    const container = parentKind === 'lane' ? rectOf(parent) : undefined
    const position = findAppendPosition({ source: rectOf(source), size: shape, obstacles, container })
    const created = this.modeling.appendShape(source, shape, position, parent, {
      connection: { type: 'bpmn:SequenceFlow' },
    } as never) as Shape
    this.selection.select(created)
    this.canvas.scrollToElement(created as never)
    this.canvas.focus() // keyboard shortcuts keep working after a pad click
    return created
  }

  private appendEntry(source: Shape, choice: AppendChoice): ContextPadEntry {
    return {
      group: 'append',
      html: entryHtml(choice.icon, choice.label),
      title: `${choice.label} (click, or drag to place it)`,
      action: {
        click: () => {
          this.append(source, choice.bpmnType)
        },
        dragstart: (event: Event) => {
          const shape = this.elementFactory.createShape({ type: choice.bpmnType } as never)
          this.create.start(event as MouseEvent, shape as never, { source } as never)
        },
      },
    }
  }

  /** What the `elements.delete` rule lets go (the same policy as the Delete key). */
  private deletable(elements: Element[]): Element[] {
    return resolveDeletable(this.rules.allowed('elements.delete', { elements }), elements)
  }

  /** A Delete entry honouring the delete rule; none when nothing may go. */
  private deleteEntries(elements: Element[]): ContextPadEntries {
    if (!this.deletable(elements).length) return {}
    return {
      delete: {
        group: 'edit',
        html: entryHtml('delete', 'Delete', 'trace-pad-delete'),
        title: 'Delete (Del)',
        action: {
          click: () => {
            const removable = this.deletable(elements)
            if (removable.length) this.modeling.removeElements(removable as never)
            this.canvas.focus()
          },
        },
      },
    }
  }
}

/** Context pad quick-add for editable canvases (pass via `additionalModules`). */
export const traceContextPadModule: EditorModule = {
  __depends__: [ContextPadModule],
  __init__: ['traceContextPad'],
  traceContextPad: ['type', TraceContextPadProvider],
}

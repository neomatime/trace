import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type CommandStack from 'diagram-js/lib/command/CommandStack.js'
import type Keyboard from 'diagram-js/lib/features/keyboard/Keyboard.js'
import type Selection from 'diagram-js/lib/features/selection/Selection.js'
import type { Connection, Element, Shape } from 'diagram-js/lib/model/Types.js'
import { connectionKindOf, shapeKindOf } from './element-kinds.ts'
import { normalizeElementName } from './label-name.ts'
import { paletteEntryFor } from './palette.ts'
import { FRAME_HEADER } from './renderer.ts'
import { flowLabelAnchor } from './render-svg.ts'

/**
 * Naming elements: an undoable rename command and an inline text editor.
 *
 * The editor is a plain `<textarea>` laid over the element's label inside the
 * canvas container (never `innerHTML`; the text is only ever read from
 * `.value` and written through the command). Enter and blur commit, Escape
 * cancels. Everything it types is normalised by `normalizeElementName`.
 */

export const RENAME_ELEMENT = 'trace.element.rename'

interface RenameContext {
  element: Element
  name: string | undefined
  oldName?: string | undefined
}

/** Undoable name change on the business object; the sync writes it to the XML `name`. */
class RenameElementHandler {
  execute(context: RenameContext): Element[] {
    const bo = context.element.businessObject as { name?: string }
    context.oldName = bo.name
    bo.name = context.name
    return [context.element]
  }

  revert(context: RenameContext): Element[] {
    const bo = context.element.businessObject as { name?: string }
    bo.name = context.oldName
    return [context.element]
  }
}

const isRoot = (element: Element) => !element.parent
const isConnection = (element: Element): element is Connection =>
  Array.isArray((element as Connection).waypoints)

/** Stage 1 kinds only: tasks, events, decisions, flows, pools and lanes. */
export function isNameable(element: Element | undefined): element is Element {
  if (!element || isRoot(element) || !element.businessObject) return false
  return isConnection(element)
    ? connectionKindOf(element.type) !== 'unknown'
    : shapeKindOf(element.type) !== 'unknown'
}

/** "task", "lane", "sequence flow"...: for the editor's accessible name. */
function plainTypeName(element: Element): string {
  if (element.type === 'bpmn:SequenceFlow') return 'sequence flow'
  if (element.type === 'bpmn:MessageFlow') return 'message flow'
  if (element.type === 'bpmn:Participant') return 'pool'
  const entry = paletteEntryFor(element.type)
  return (entry?.label ?? element.type.replace(/^bpmn:/, '')).toLowerCase()
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

interface Placement {
  /** Diagram coordinates. */
  box: Box
  align: 'left' | 'center' | 'right'
  /** Pool and lane names run bottom-to-top along the header band. */
  vertical: boolean
  fontSize: number
}

const LABEL_FONT = 12
const FLOW_FONT = 11

function placementOf(element: Element): Placement {
  if (isConnection(element)) {
    const isMessage = connectionKindOf(element.type) === 'message-flow'
    const { anchor, vertical } = flowLabelAnchor(element.waypoints, isMessage)
    const box = vertical
      ? { left: anchor.x + 2, top: anchor.y - 12, width: 120, height: 26 }
      : { left: anchor.x - 60, top: anchor.y - 28, width: 120, height: 26 }
    return { box, align: vertical ? 'left' : 'center', vertical: false, fontSize: FLOW_FONT }
  }
  const shape = element as Shape
  const { x, y, width: w, height: h } = shape
  switch (shapeKindOf(shape.type)) {
    case 'start-event':
    case 'end-event':
      return {
        box: { left: x + w / 2 - 60, top: y + h + 2, width: 120, height: 36 },
        align: 'center',
        vertical: false,
        fontSize: LABEL_FONT,
      }
    case 'exclusive-gateway':
      return {
        box: { left: x + w / 2 - 8 - 120, top: y - 40, width: 120, height: 36 },
        align: 'right',
        vertical: false,
        fontSize: LABEL_FONT,
      }
    case 'participant':
    case 'lane': {
      const collapsed = shape.type === 'bpmn:Participant' && !shape.businessObject?.processRef
      return collapsed
        ? { box: { left: x + 8, top: y + h / 2 - 20, width: w - 16, height: 40 }, align: 'center', vertical: false, fontSize: LABEL_FONT }
        : { box: { left: x, top: y, width: FRAME_HEADER, height: h }, align: 'center', vertical: true, fontSize: LABEL_FONT }
    }
    default: {
      const height = Math.min(h - 8, 50)
      return {
        box: { left: x + 4, top: y + (h - height) / 2, width: w - 8, height },
        align: 'center',
        vertical: false,
        fontSize: LABEL_FONT,
      }
    }
  }
}

interface Active {
  element: Element
  field: HTMLTextAreaElement
}

/** Inline label editing plus `rename`, available on editable canvases. */
export default class TraceLabelEditing {
  static $inject = ['eventBus', 'canvas', 'commandStack', 'elementRegistry', 'selection', 'keyboard']

  private readonly canvas: Canvas
  private readonly commandStack: CommandStack
  private readonly registry: ElementRegistry
  private readonly selection: Selection
  private active: Active | null = null

  constructor(
    eventBus: EventBus,
    canvas: Canvas,
    commandStack: CommandStack,
    registry: ElementRegistry,
    selection: Selection,
    keyboard: Keyboard,
  ) {
    this.canvas = canvas
    this.commandStack = commandStack
    this.registry = registry
    this.selection = selection
    commandStack.registerHandler(RENAME_ELEMENT, RenameElementHandler as never)

    eventBus.on('element.dblclick', (event: { element: Element }) => {
      if (!isNameable(event.element)) return
      if (!this.selection.isSelected(event.element)) this.selection.select(event.element)
      this.start(event.element)
    })

    // F2 renames the selected element (above diagram-js's own bindings).
    keyboard.addListener(1500, (context: { keyEvent: KeyboardEvent }) => {
      const event = context.keyEvent
      if (event.key !== 'F2' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      const selected = this.selection.get() as Element[]
      if (selected.length !== 1 || !this.start(selected[0])) return
      return true
    })

    // A shape dropped from the palette or the context pad: name it straight away.
    eventBus.on('create.end', 500, (event: { shape?: Shape; context?: { canExecute?: unknown } }) => {
      const shape = event.shape
      if (!shape || event.context?.canExecute === false) return
      setTimeout(() => {
        const created = this.registry.get(shape.id) as Element | undefined
        if (!created || !created.parent) return
        this.selection.select(created)
        this.start(created)
      }, 0)
    })

    // Keep the field over its label while panning or zooming.
    eventBus.on('canvas.viewbox.changed', () => this.reposition())
    // Importing a new diagram throws the open editor away.
    eventBus.on(['diagram.clear', 'diagram.destroy'], () => this.close(false))
  }

  /** Name `element` (normalised). One undo step; nothing happens when the name does not change. */
  rename(element: Element, raw: string): boolean {
    if (!isNameable(element)) return false
    const name = normalizeElementName(raw)
    const current = (element.businessObject as { name?: string }).name
    if ((current ?? undefined) === name) return true
    this.commandStack.execute(RENAME_ELEMENT, { element, name })
    return true
  }

  /** Open the inline editor over the element's label. False for elements without a name. */
  start(element: Element | undefined): boolean {
    if (!isNameable(element)) return false
    this.close(true)

    const placement = placementOf(element)
    const field = document.createElement('textarea')
    field.className = 'trace-label-editor'
    if (placement.vertical) field.classList.add('trace-label-editor-vertical')
    field.rows = 1
    field.maxLength = 240
    field.spellcheck = false
    field.autocomplete = 'off'
    field.value = (element.businessObject as { name?: string }).name ?? ''
    field.setAttribute('aria-label', `Rename ${plainTypeName(element)}`)

    // Typing and pointing here must not reach diagram-js (Delete, shortcuts, panning, zoom).
    for (const type of ['keyup', 'mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'contextmenu', 'pointerdown']) {
      field.addEventListener(type, (event) => event.stopPropagation())
    }
    field.addEventListener('keydown', (event) => {
      event.stopPropagation()
      if (event.key === 'Enter') {
        event.preventDefault()
        this.close(true, true)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        this.close(false, true)
      }
    })
    field.addEventListener('blur', () => this.close(true))

    this.active = { element, field }
    this.canvas.getContainer().appendChild(field)
    this.reposition(placement)
    field.focus({ preventScroll: true })
    field.select()
    return true
  }

  /** Close the editor, committing what was typed or discarding it. */
  close(commit: boolean, refocus = false): void {
    const active = this.active
    if (!active) return
    this.active = null // first: removing a focused field fires blur, which must find nothing to close
    const value = active.field.value
    active.field.remove()
    if (commit && this.registry.get(active.element.id)) this.rename(active.element, value)
    // Back to the canvas after Enter / Escape; after a blur the user already chose where focus goes.
    if (refocus) this.canvas.focus()
  }

  private reposition(known?: Placement): void {
    const active = this.active
    if (!active) return
    const placement = known ?? placementOf(active.element)
    const view = this.canvas.viewbox()
    const scale = view.scale
    const style = active.field.style
    style.left = `${(placement.box.left - view.x) * scale}px`
    style.top = `${(placement.box.top - view.y) * scale}px`
    style.width = `${placement.box.width * scale}px`
    style.height = `${placement.box.height * scale}px`
    style.fontSize = `${placement.fontSize * scale}px`
    style.textAlign = placement.align
  }
}

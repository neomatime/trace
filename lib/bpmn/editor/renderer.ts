import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type { Connection, Element, Shape } from 'diagram-js/lib/model/Types.js'
import Text from 'diagram-js/lib/util/Text.js'
import { connectionKindOf, shapeKindOf, taskIconOf } from './element-kinds.ts'
import { arrowHeadPoints, drawTaskIcon, group, svg, type Pt } from './render-svg.ts'

/**
 * SVG notation for the Stage 1 BPMN element set, drawn from scratch:
 * thin-ring start events, thick-ring end events, rounded task boxes with
 * user/manual/service icons, an exclusive gateway diamond with an X, solid
 * sequence flows with filled arrowheads, dashed message flows with an open
 * circle and open arrowhead, and pool/lane frames with vertical headers.
 *
 * Every outline carries `tb-body` so compare/issue markers can recolour it in
 * CSS; colours come from theme tokens in bpmn-editor.css.
 */

const HEADER = 30
const TASK_RADIUS = 10
const LABEL_STYLE = { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 12, lineHeight: 1.2 }

type Visuals = SVGElement

export default class TraceRenderer extends BaseRenderer {
  static $inject = ['eventBus']

  private readonly text = new Text({ style: LABEL_STYLE })

  constructor(eventBus: EventBus) {
    super(eventBus, 1500)
  }

  canRender(element: Element): boolean {
    return !!element.businessObject && !!element.parent
  }

  drawShape(visuals: Visuals, shape: Shape): SVGElement {
    const name: string = shape.businessObject?.name ?? ''
    switch (shapeKindOf(shape.type)) {
      case 'start-event':
        return this.drawEvent(visuals, shape, name, 'tb-start-event')
      case 'end-event':
        return this.drawEvent(visuals, shape, name, 'tb-end-event')
      case 'task':
        return this.drawTask(visuals, shape, name)
      case 'exclusive-gateway':
        return this.drawGateway(visuals, shape, name)
      case 'participant':
        return this.drawFrame(visuals, shape, name, 'tb-pool', !shape.businessObject?.processRef)
      case 'lane':
        return this.drawFrame(visuals, shape, name, 'tb-lane', false)
      default:
        return this.drawUnknown(visuals, shape, name)
    }
  }

  drawConnection(visuals: Visuals, connection: Connection): SVGElement {
    const points = connection.waypoints
    const isMessage = connectionKindOf(connection.type) === 'message-flow'
    const kindClass = isMessage ? 'tb-message-flow' : 'tb-sequence-flow'
    const line = svg(
      visuals,
      'polyline',
      { points: points.map((p) => `${p.x},${p.y}`).join(' ') },
      `tb-body tb-flow ${kindClass}`,
    )
    if (points.length >= 2) {
      const tip = points[points.length - 1]
      const before = points[points.length - 2]
      svg(visuals, 'polygon', { points: arrowHeadPoints(before, tip) }, `tb-arrow ${kindClass}-arrow`)
      if (isMessage) {
        const [start, next] = points
        const len = Math.hypot(next.x - start.x, next.y - start.y) || 1
        const r = 4
        svg(
          visuals,
          'circle',
          { cx: start.x + ((next.x - start.x) / len) * r, cy: start.y + ((next.y - start.y) / len) * r, r },
          'tb-message-flow-source',
        )
      }
    }
    const name: string = connection.businessObject?.name ?? ''
    if (name && points.length >= 2) this.drawFlowLabel(visuals, points, name, isMessage)
    return line
  }

  getShapePath(shape: Shape): string {
    const { x, y, width: w, height: h } = shape
    const kind = shapeKindOf(shape.type)
    if (kind === 'start-event' || kind === 'end-event') {
      const r = Math.min(w, h) / 2
      const cx = x + w / 2
      const cy = y + h / 2
      return `M${cx},${cy - r} a${r},${r} 0 1,1 0,${2 * r} a${r},${r} 0 1,1 0,${-2 * r}Z`
    }
    if (kind === 'exclusive-gateway') {
      return `M${x + w / 2},${y} L${x + w},${y + h / 2} L${x + w / 2},${y + h} L${x},${y + h / 2}Z`
    }
    return `M${x},${y} h${w} v${h} h${-w}Z`
  }

  getConnectionPath(connection: Connection): string {
    return connection.waypoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  }

  private drawEvent(visuals: Visuals, shape: Shape, name: string, kindClass: string): SVGElement {
    const r = Math.min(shape.width, shape.height) / 2
    const circle = svg(visuals, 'circle', { cx: shape.width / 2, cy: shape.height / 2, r }, `tb-body ${kindClass}`)
    this.drawExternalLabel(visuals, shape, name)
    return circle
  }

  private drawTask(visuals: Visuals, shape: Shape, name: string): SVGElement {
    const rect = svg(
      visuals,
      'rect',
      { x: 0, y: 0, width: shape.width, height: shape.height, rx: TASK_RADIUS, ry: TASK_RADIUS },
      'tb-body tb-task',
    )
    const icon = taskIconOf(shape.type)
    if (icon) drawTaskIcon(visuals, icon)
    this.drawBoxLabel(visuals, name, { width: shape.width, height: shape.height }, icon ? 18 : 6)
    return rect
  }

  private drawGateway(visuals: Visuals, shape: Shape, name: string): SVGElement {
    const { width: w, height: h } = shape
    const diamond = svg(
      visuals,
      'polygon',
      { points: `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}` },
      'tb-body tb-gateway',
    )
    const a = 0.32
    const b = 0.68
    svg(visuals, 'path', { d: `M${w * a},${h * a} L${w * b},${h * b} M${w * b},${h * a} L${w * a},${h * b}` }, 'tb-gateway-x')
    // Above-left of the top corner: gateway flows usually leave right, top or bottom.
    if (name) {
      svg(visuals, 'text', { x: w / 2 - 8, y: -6, 'text-anchor': 'end' }, 'tb-label tb-gateway-label').textContent =
        name
    }
    return diamond
  }

  private drawFrame(visuals: Visuals, shape: Shape, name: string, kindClass: string, collapsed: boolean): SVGElement {
    const { width: w, height: h } = shape
    const frame = svg(visuals, 'rect', { x: 0, y: 0, width: w, height: h }, `tb-body tb-frame ${kindClass}`)
    if (collapsed) {
      this.drawBoxLabel(visuals, name, { width: w, height: h }, 0, `tb-frame-label ${kindClass}-label`)
      return frame
    }
    svg(visuals, 'rect', { x: 0, y: 0, width: HEADER, height: h }, `tb-frame-header ${kindClass}-header`)
    svg(visuals, 'line', { x1: HEADER, y1: 0, x2: HEADER, y2: h }, `tb-frame-divider ${kindClass}-divider`)
    // Lay the name out along a box h wide, then turn it to read bottom-to-top.
    const header = group(visuals, 'tb-frame-name', `translate(0 ${h}) rotate(-90)`)
    this.drawBoxLabel(header, name, { width: h, height: HEADER }, 0, `tb-frame-label ${kindClass}-label`)
    return frame
  }

  private drawUnknown(visuals: Visuals, shape: Shape, name: string): SVGElement {
    const rect = svg(visuals, 'rect', { x: 0, y: 0, width: shape.width, height: shape.height }, 'tb-body tb-unknown')
    const local = String(shape.type ?? '').replace(/^bpmn:/, '')
    this.drawBoxLabel(visuals, name ? `${name}\n(${local})` : local, { width: shape.width, height: shape.height }, 4)
    return rect
  }

  /** Name centred inside a box (tasks, collapsed pools, rotated headers). */
  private drawBoxLabel(
    parent: SVGElement,
    name: string,
    box: { width: number; height: number },
    padding: number,
    className = 'tb-label',
  ): void {
    if (!name) return
    const text = this.text.createText(name, {
      box,
      align: 'center-middle',
      padding: { top: padding, left: 6, right: 6, bottom: 4 },
    })
    text.setAttribute('class', className.includes('tb-label') ? className : `tb-label ${className}`)
    parent.appendChild(text)
  }

  /** Name below events and gateways, BPMN-style. */
  private drawExternalLabel(parent: SVGElement, shape: Shape, name: string): void {
    if (!name) return
    const width = 100
    const holder = group(parent, 'tb-external-label', `translate(${shape.width / 2 - width / 2} ${shape.height + 4})`)
    const text = this.text.createText(name, { box: { width, height: 30 }, align: 'center-top' })
    text.setAttribute('class', 'tb-label')
    holder.appendChild(text)
  }

  private drawFlowLabel(parent: SVGElement, points: readonly Pt[], name: string, isMessage: boolean): void {
    let anchor: Pt
    let dir: Pt
    if (isMessage) {
      const mid = Math.floor((points.length - 1) / 2)
      const a = points[mid]
      const b = points[mid + 1]
      anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      dir = { x: b.x - a.x, y: b.y - a.y }
    } else {
      const [a, b] = points
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const step = Math.min(16, len / 2)
      anchor = { x: a.x + ((b.x - a.x) / len) * step, y: a.y + ((b.y - a.y) / len) * step }
      dir = { x: b.x - a.x, y: b.y - a.y }
    }
    const vertical = Math.abs(dir.y) > Math.abs(dir.x)
    svg(
      parent,
      'text',
      vertical ? { x: anchor.x + 6, y: anchor.y + 4 } : { x: anchor.x, y: anchor.y - 6 },
      'tb-label tb-flow-label',
    ).textContent = name
  }
}

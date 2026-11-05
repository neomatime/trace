import ElementFactory from 'diagram-js/lib/core/ElementFactory.js'
import type BpmnDocument from './document.ts'
import { defaultSizeOf, isConnectionType } from './element-kinds.ts'

type Attrs = Record<string, unknown> & {
  type?: string
  id?: string
  // moddle elements are schema-driven and untyped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  businessObject?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  di?: any
  width?: number
  height?: number
  name?: string
}

/**
 * Element factory that pairs every canvas element with a BPMN business object
 * (`businessObject`) and its DI (`di`). Callers may pass just `{ type }`, e.g.
 * `elementFactory.createShape({ type: 'bpmn:UserTask' })`, and get a moddle
 * element with a fresh id, the BPMN default size and a DI shape.
 */
export default class TraceElementFactory extends ElementFactory {
  static $inject = ['bpmnDocument']

  private readonly document: BpmnDocument

  constructor(document: BpmnDocument) {
    super()
    this.document = document
  }

  // Signature widened on purpose: it must satisfy all four overloads of the
  // base class while adding BPMN defaults.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(elementType: 'root' | 'shape' | 'connection' | 'label', attrs: Attrs = {}): any {
    if (elementType === 'root' || elementType === 'label') {
      return super.create(elementType as 'root', this.withType(attrs))
    }
    const { moddle } = this.document
    let next: Attrs = { ...attrs }

    if (!next.businessObject) {
      if (!next.type) throw new Error('A BPMN element needs a "type" such as "bpmn:Task"')
      const id = next.id ?? this.document.nextId(next.type)
      next.businessObject = moddle.create(next.type, {
        id,
        ...(next.name ? { name: next.name } : {}),
      })
      delete next.name
    }
    next = this.withType(next)
    next.id = next.businessObject.id

    if (elementType === 'connection') {
      if (!isConnectionType(String(next.type))) {
        throw new Error(`"${next.type}" is not a connection type`)
      }
      next.di ??= moddle.create('bpmndi:BPMNEdge', {
        id: `${next.id}_di`,
        bpmnElement: next.businessObject,
      })
      return super.create('connection', next as never)
    }

    const size = defaultSizeOf(String(next.type))
    next.width ??= size.width
    next.height ??= size.height
    next.di ??= moddle.create('bpmndi:BPMNShape', {
      id: `${next.id}_di`,
      bpmnElement: next.businessObject,
      ...(next.type === 'bpmn:Participant' || next.type === 'bpmn:Lane' ? { isHorizontal: true } : {}),
    })
    return super.create('shape', next as never)
  }

  private withType(attrs: Attrs): Attrs {
    if (attrs.type || !attrs.businessObject) return attrs
    return { ...attrs, type: attrs.businessObject.$type }
  }
}

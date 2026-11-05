// bpmn-moddle ships types only under the "bpmn-moddle/types" subpath, so the
// package root resolves to implicit any. This declares the small surface the
// BPMN adapter uses. The runtime export is the named `BpmnModdle` class.
declare module 'bpmn-moddle' {
  export interface ModdleElement {
    $type: string
    $instanceOf(type: string): boolean
    // moddle elements carry arbitrary schema-defined properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [property: string]: any
  }

  export interface ModdlePackage {
    name: string
    uri: string
    prefix: string
    xml?: { tagAlias?: 'lowerCase' }
    types: readonly unknown[]
    associations?: readonly unknown[]
  }

  export interface FromXmlResult {
    rootElement: ModdleElement
    elementsById: Record<string, ModdleElement>
    references: readonly unknown[]
    warnings: readonly unknown[]
  }

  export class BpmnModdle {
    constructor(packages?: Record<string, ModdlePackage>)
    create(type: string, attrs?: Record<string, unknown>): ModdleElement
    fromXML(xml: string): Promise<FromXmlResult>
    toXML(element: ModdleElement, options?: { format?: boolean }): Promise<{ xml: string }>
  }
}

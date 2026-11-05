import type { ModdleElement } from 'bpmn-moddle'
import { createModdle } from './trace-moddle.ts'
import type { EntityId } from '../../types/common.ts'

function shapesByElementId(definitions: ModdleElement): Map<string, ModdleElement> {
  const shapes = new Map<string, ModdleElement>()
  for (const diagram of (definitions.diagrams ?? []) as ModdleElement[]) {
    for (const planeElement of (diagram.plane?.planeElement ?? []) as ModdleElement[]) {
      const id = planeElement.bpmnElement?.id
      if (planeElement.$type === 'bpmndi:BPMNShape' && id) shapes.set(id, planeElement)
    }
  }
  return shapes
}

/**
 * The To-Be XML plus copies of the removed As-Is flow nodes and their DI shapes
 * at their As-Is coordinates, so a compare view can show what was taken out.
 * Unknown ids, non-flow-node ids and ids already present in the To-Be are skipped.
 */
export async function buildCompareXml(
  asIsXml: string,
  toBeXml: string,
  removedIds: readonly EntityId[],
): Promise<string> {
  const moddle = createModdle()
  const asIs = await moddle.fromXML(asIsXml)
  const toBe = await moddle.fromXML(toBeXml)
  const asIsShapes = shapesByElementId(asIs.rootElement)

  const toBeProcess = ((toBe.rootElement.rootElements ?? []) as ModdleElement[]).find(
    (root) => root.$type === 'bpmn:Process',
  )
  const toBePlane = (toBe.rootElement.diagrams ?? [])[0]?.plane as ModdleElement | undefined

  if (toBeProcess && toBePlane) {
    for (const id of removedIds) {
      const original = asIs.elementsById[id]
      if (!original || !original.$instanceOf('bpmn:FlowNode') || toBe.elementsById[id]) continue

      const copy = moddle.create(original.$type, { id, name: original.name })
      toBeProcess.flowElements = [...(toBeProcess.flowElements ?? []), copy]

      const shape = asIsShapes.get(id)
      if (shape?.bounds) {
        const shapeId = toBe.elementsById[shape.id] ? `${shape.id}_removed` : shape.id
        const { x, y, width, height } = shape.bounds
        toBePlane.planeElement = [
          ...(toBePlane.planeElement ?? []),
          moddle.create('bpmndi:BPMNShape', {
            id: shapeId,
            bpmnElement: copy,
            bounds: moddle.create('dc:Bounds', { x, y, width, height }),
          }),
        ]
      }
    }
  }

  const { xml } = await moddle.toXML(toBe.rootElement, { format: true })
  return xml
}

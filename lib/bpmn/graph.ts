import type { BpmnModdle, ModdleElement } from 'bpmn-moddle'
import { createModdle } from './trace-moddle.ts'
import type { EntityId } from '../../types/common.ts'
import type {
  AuditFields,
  ProcessEdge,
  ProcessElement,
  ProcessGraph,
} from '../../types/process-flow.ts'

export type ParseResult = { ok: true; graph: ProcessGraph } | { ok: false; error: string }

const AUDIT_TYPE = 'trace:AuditFields'

function messageOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.trim().length > 0 ? message : 'Unable to read the BPMN XML'
}

export function readAuditFields(element: ModdleElement): AuditFields {
  const holder = (element.extensionElements?.values ?? []).find(
    (value: ModdleElement) => value.$type === AUDIT_TYPE,
  )
  const evidenceIds: string[] = holder
    ? (holder.evidence ?? []).map((e: ModdleElement) => String(e.ref))
    : []
  const audit: {
    -readonly [K in keyof AuditFields]: AuditFields[K]
  } = { evidenceIds }
  if (!holder) return audit
  if (holder.owner !== undefined) audit.owner = holder.owner
  if (holder.system !== undefined) audit.system = holder.system
  if (holder.input !== undefined) audit.input = holder.input
  if (holder.output !== undefined) audit.output = holder.output
  if (holder.workMinutes !== undefined) audit.workMinutes = holder.workMinutes
  if (holder.waitMinutes !== undefined) audit.waitMinutes = holder.waitMinutes
  if (holder.approvalRequired !== undefined) audit.approvalRequired = holder.approvalRequired
  if (holder.control !== undefined) audit.control = holder.control
  if (holder.painPoint !== undefined) audit.painPoint = holder.painPoint
  return audit
}

function collectFlowElements(
  container: ModdleElement,
  laneByNode: ReadonlyMap<string, string>,
  elements: ProcessElement[],
  edges: ProcessEdge[],
): void {
  for (const child of (container.flowElements ?? []) as ModdleElement[]) {
    if (child.$instanceOf('bpmn:SequenceFlow')) {
      edges.push(toEdge(child, 'sequence'))
    } else if (child.$instanceOf('bpmn:FlowNode')) {
      const laneId = laneByNode.get(child.id)
      elements.push({
        id: child.id,
        bpmnType: child.$type,
        name: child.name ?? '',
        ...(laneId !== undefined ? { laneId } : {}),
        audit: readAuditFields(child),
      })
      if (child.$instanceOf('bpmn:SubProcess')) {
        collectFlowElements(child, laneByNode, elements, edges)
      }
    }
  }
}

function toEdge(flow: ModdleElement, kind: ProcessEdge['kind']): ProcessEdge {
  return {
    id: flow.id,
    sourceId: flow.sourceRef?.id ?? '',
    targetId: flow.targetRef?.id ?? '',
    kind,
    ...(flow.name ? { label: flow.name } : {}),
  }
}

function laneAssignments(process: ModdleElement): Map<string, string> {
  const result = new Map<string, string>()
  const visit = (lanes: ModdleElement[]) => {
    for (const lane of lanes) {
      for (const ref of (lane.flowNodeRef ?? []) as ModdleElement[]) result.set(ref.id, lane.id)
      if (lane.childLaneSet) visit(lane.childLaneSet.lanes ?? [])
    }
  }
  for (const laneSet of (process.laneSets ?? []) as ModdleElement[]) visit(laneSet.lanes ?? [])
  return result
}

export async function parseBpmnXml(xml: string): Promise<ParseResult> {
  try {
    if (typeof xml !== 'string' || xml.trim().length === 0) {
      return { ok: false, error: 'The BPMN XML is empty' }
    }
    const { rootElement } = await createModdle().fromXML(xml)
    if (!rootElement || rootElement.$type !== 'bpmn:Definitions') {
      return { ok: false, error: 'The document is not a BPMN definitions file' }
    }
    const elements: ProcessElement[] = []
    const edges: ProcessEdge[] = []
    for (const root of (rootElement.rootElements ?? []) as ModdleElement[]) {
      if (root.$type === 'bpmn:Process') {
        collectFlowElements(root, laneAssignments(root), elements, edges)
      } else if (root.$type === 'bpmn:Collaboration') {
        for (const flow of (root.messageFlows ?? []) as ModdleElement[]) {
          edges.push(toEdge(flow, 'message'))
        }
      }
    }
    return { ok: true, graph: { elements, edges } }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

const DI_SHAPE_SIZE = { width: 600, height: 250 }

export async function emptyProcessXml(processName: string): Promise<string> {
  const moddle = createModdle()
  const process = moddle.create('bpmn:Process', { id: 'Process_1', isExecutable: false })
  const participant = moddle.create('bpmn:Participant', {
    id: 'Participant_1',
    name: processName,
    processRef: process,
  })
  const collaboration = moddle.create('bpmn:Collaboration', {
    id: 'Collaboration_1',
    participants: [participant],
  })
  const shape = moddle.create('bpmndi:BPMNShape', {
    id: 'Participant_1_di',
    bpmnElement: participant,
    isHorizontal: true,
    bounds: moddle.create('dc:Bounds', { x: 160, y: 80, ...DI_SHAPE_SIZE }),
  })
  const plane = moddle.create('bpmndi:BPMNPlane', {
    id: 'BPMNPlane_1',
    bpmnElement: collaboration,
    planeElement: [shape],
  })
  const diagram = moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram_1', plane })
  const definitions = moddle.create('bpmn:Definitions', {
    id: 'Definitions_1',
    targetNamespace: 'http://himark.co.za/bpmn',
    rootElements: [collaboration, process],
    diagrams: [diagram],
  })
  const { xml } = await moddle.toXML(definitions, { format: true })
  return xml
}

export async function setAuditFieldsInXml(
  xml: string,
  elementId: EntityId,
  fields: AuditFields,
): Promise<string> {
  const moddle = createModdle()
  const { rootElement, elementsById } = await moddle.fromXML(xml)
  const target = elementsById[elementId]
  if (!target) throw new Error(`Element "${elementId}" was not found in the BPMN XML`)
  applyAuditFields(moddle, target, fields)
  const result = await moddle.toXML(rootElement, { format: true })
  return result.xml
}

/**
 * Replaces the `trace:AuditFields` extension of a moddle element in place,
 * keeping any other extension values. Removes the extension when empty.
 */
export function applyAuditFields(moddle: BpmnModdle, target: ModdleElement, fields: AuditFields): void {
  const others = ((target.extensionElements?.values ?? []) as ModdleElement[]).filter(
    (value) => value.$type !== AUDIT_TYPE,
  )

  const attrs: Record<string, unknown> = {}
  for (const key of [
    'owner',
    'system',
    'input',
    'output',
    'workMinutes',
    'waitMinutes',
    'approvalRequired',
    'control',
    'painPoint',
  ] as const) {
    if (fields[key] !== undefined) attrs[key] = fields[key]
  }
  const hasAudit = Object.keys(attrs).length > 0 || fields.evidenceIds.length > 0
  const values = [...others]
  if (hasAudit) {
    attrs.evidence = fields.evidenceIds.map((ref) => moddle.create('trace:EvidenceRef', { ref }))
    values.push(moddle.create(AUDIT_TYPE, attrs))
  }

  if (values.length === 0) {
    target.extensionElements = undefined
  } else {
    const extension =
      target.extensionElements ?? moddle.create('bpmn:ExtensionElements', { values: [] })
    extension.values = values
    target.extensionElements = extension
  }
}

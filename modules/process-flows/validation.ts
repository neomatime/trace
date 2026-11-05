import type { EntityId } from '../../types/common.ts'
import type { ProcessGraph } from '../../types/process-flow.ts'

export interface ValidationIssue {
  elementId?: EntityId
  severity: 'error' | 'warning'
  message: string
}

export function validateGraph(graph: ProcessGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (graph.elements.length === 0) {
    issues.push({ severity: 'error', message: 'This process has no steps yet.' })
  }
  if (!graph.elements.some((e) => e.bpmnType === 'bpmn:StartEvent')) {
    issues.push({ severity: 'error', message: 'Add a start event to show where this process begins.' })
  }
  if (!graph.elements.some((e) => e.bpmnType === 'bpmn:EndEvent')) {
    issues.push({ severity: 'error', message: 'Add an end event to show where this process finishes.' })
  }

  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()
  for (const edge of graph.edges) {
    if (edge.kind !== 'sequence') continue
    outgoing.set(edge.sourceId, (outgoing.get(edge.sourceId) ?? 0) + 1)
    incoming.set(edge.targetId, (incoming.get(edge.targetId) ?? 0) + 1)
  }

  for (const element of graph.elements) {
    const out = outgoing.get(element.id) ?? 0
    const inc = incoming.get(element.id) ?? 0

    if (element.bpmnType === 'bpmn:ExclusiveGateway' && out < 2 && (inc >= 2 || inc === 0)) {
      issues.push({ elementId: element.id, severity: 'warning', message: 'This decision has only one path out.' })
    }
    if (element.bpmnType !== 'bpmn:EndEvent' && out === 0) {
      issues.push({ elementId: element.id, severity: 'warning', message: 'Nothing follows this step.' })
    }
  }

  return issues
}

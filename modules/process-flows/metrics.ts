import type { ProcessGraph } from '../../types/process-flow.ts'

export interface ProcessMetrics {
  steps: number
  manualSteps: number
  handoffs: number
  approvals: number
  workMinutes: number
  waitMinutes: number
}

const STEP_TYPES: ReadonlySet<string> = new Set([
  'bpmn:Task',
  'bpmn:UserTask',
  'bpmn:ManualTask',
  'bpmn:ServiceTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:SubProcess',
  'bpmn:CallActivity',
])

const MANUAL_TYPES: ReadonlySet<string> = new Set(['bpmn:ManualTask', 'bpmn:UserTask'])

export function computeMetrics(graph: ProcessGraph): ProcessMetrics {
  const metrics: ProcessMetrics = {
    steps: 0,
    manualSteps: 0,
    handoffs: 0,
    approvals: 0,
    workMinutes: 0,
    waitMinutes: 0,
  }
  const laneById = new Map<string, string | undefined>()

  for (const element of graph.elements) {
    laneById.set(element.id, element.laneId)
    if (STEP_TYPES.has(element.bpmnType)) metrics.steps += 1
    if (MANUAL_TYPES.has(element.bpmnType)) metrics.manualSteps += 1
    if (element.audit.approvalRequired === true) metrics.approvals += 1
    metrics.workMinutes += element.audit.workMinutes ?? 0
    metrics.waitMinutes += element.audit.waitMinutes ?? 0
  }

  for (const edge of graph.edges) {
    if (edge.kind !== 'sequence') continue
    const from = laneById.get(edge.sourceId)
    const to = laneById.get(edge.targetId)
    if (from && to && from !== to) metrics.handoffs += 1
  }

  return metrics
}

export function compareMetrics(asIs: ProcessMetrics, toBe: ProcessMetrics): ProcessMetrics {
  return {
    steps: toBe.steps - asIs.steps,
    manualSteps: toBe.manualSteps - asIs.manualSteps,
    handoffs: toBe.handoffs - asIs.handoffs,
    approvals: toBe.approvals - asIs.approvals,
    workMinutes: toBe.workMinutes - asIs.workMinutes,
    waitMinutes: toBe.waitMinutes - asIs.waitMinutes,
  }
}

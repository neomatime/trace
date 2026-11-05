import test from 'node:test'
import assert from 'node:assert/strict'
import { compareMetrics, computeMetrics } from '../modules/process-flows/metrics.ts'
import type { ProcessEdge, ProcessElement, ProcessGraph } from '../types/process-flow.ts'

function el(
  id: string,
  bpmnType: string,
  laneId: string | undefined,
  audit: Partial<ProcessElement['audit']> = {},
): ProcessElement {
  return { id, bpmnType, name: id, laneId, audit: { evidenceIds: [], ...audit } }
}

function edge(id: string, sourceId: string, targetId: string, kind: ProcessEdge['kind'] = 'sequence'): ProcessEdge {
  return { id, sourceId, targetId, kind }
}

const graph: ProcessGraph = {
  elements: [
    el('a', 'bpmn:UserTask', 'l1', { workMinutes: 10, waitMinutes: 5, approvalRequired: true }),
    el('b', 'bpmn:ServiceTask', 'l1', { workMinutes: 3 }),
    el('c', 'bpmn:ManualTask', 'l2', { waitMinutes: 20, approvalRequired: true }),
    el('d', 'bpmn:SubProcess', 'l2', { workMinutes: 7, approvalRequired: false }),
  ],
  edges: [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'd')],
}

test('counts steps, manual steps, approvals and sums times', () => {
  assert.deepEqual(computeMetrics(graph), {
    steps: 4,
    manualSteps: 2,
    handoffs: 1,
    approvals: 2,
    workMinutes: 20,
    waitMinutes: 25,
  })
})

test('hand-offs count only edges crossing lanes', () => {
  const g: ProcessGraph = {
    elements: [
      el('a', 'bpmn:Task', 'l1'),
      el('b', 'bpmn:Task', 'l2'),
      el('c', 'bpmn:Task', 'l2'),
      el('d', 'bpmn:Task', undefined),
    ],
    edges: [
      edge('e1', 'a', 'b'),
      edge('e2', 'b', 'c'),
      edge('e3', 'c', 'd'),
      edge('e4', 'a', 'c', 'message'),
    ],
  }
  assert.equal(computeMetrics(g).handoffs, 1)
})

test('events and gateways are not steps', () => {
  const g: ProcessGraph = {
    elements: [
      el('s', 'bpmn:StartEvent', 'l1'),
      el('x', 'bpmn:ExclusiveGateway', 'l1'),
      el('t', 'bpmn:EndEvent', 'l1'),
    ],
    edges: [],
  }
  const m = computeMetrics(g)
  assert.equal(m.steps, 0)
  assert.equal(m.manualSteps, 0)
})

test('empty graph yields all zeros', () => {
  assert.deepEqual(computeMetrics({ elements: [], edges: [] }), {
    steps: 0,
    manualSteps: 0,
    handoffs: 0,
    approvals: 0,
    workMinutes: 0,
    waitMinutes: 0,
  })
})

test('compareMetrics returns negative deltas when the To-Be is leaner', () => {
  const asIs = computeMetrics(graph)
  const toBe = {
    steps: 3,
    manualSteps: 1,
    handoffs: 0,
    approvals: 1,
    workMinutes: 12,
    waitMinutes: 5,
  }
  assert.deepEqual(compareMetrics(asIs, toBe), {
    steps: -1,
    manualSteps: -1,
    handoffs: -1,
    approvals: -1,
    workMinutes: -8,
    waitMinutes: -20,
  })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { validateGraph } from '../modules/process-flows/validation.ts'
import type { ProcessEdge, ProcessElement, ProcessGraph } from '../types/process-flow.ts'

function el(id: string, bpmnType: string): ProcessElement {
  return { id, bpmnType, name: id, audit: { evidenceIds: [] } }
}

function edge(id: string, sourceId: string, targetId: string): ProcessEdge {
  return { id, sourceId, targetId, kind: 'sequence' }
}

test('empty graph reports no steps, no start, no end', () => {
  const issues = validateGraph({ elements: [], edges: [] })
  assert.deepEqual(issues, [
    { severity: 'error', message: 'This process has no steps yet.' },
    { severity: 'error', message: 'Add a start event to show where this process begins.' },
    { severity: 'error', message: 'Add an end event to show where this process finishes.' },
  ])
})

test('valid linear process has no issues', () => {
  const graph: ProcessGraph = {
    elements: [el('s', 'bpmn:StartEvent'), el('t', 'bpmn:Task'), el('e', 'bpmn:EndEvent')],
    edges: [edge('1', 's', 't'), edge('2', 't', 'e')],
  }
  assert.deepEqual(validateGraph(graph), [])
})

test('exclusive gateway with a single outgoing flow warns', () => {
  const graph: ProcessGraph = {
    elements: [el('s', 'bpmn:StartEvent'), el('g', 'bpmn:ExclusiveGateway'), el('t', 'bpmn:Task'), el('e', 'bpmn:EndEvent')],
    edges: [edge('1', 's', 't'), edge('2', 't', 'e'), edge('3', 'g', 't')],
  }
  assert.deepEqual(validateGraph(graph), [
    { elementId: 'g', severity: 'warning', message: 'This decision has only one path out.' },
  ])
})

test('dangling step warns', () => {
  const graph: ProcessGraph = {
    elements: [el('s', 'bpmn:StartEvent'), el('t', 'bpmn:Task'), el('d', 'bpmn:Task'), el('e', 'bpmn:EndEvent')],
    edges: [edge('1', 's', 't'), edge('2', 't', 'e')],
  }
  assert.deepEqual(validateGraph(graph), [
    { elementId: 'd', severity: 'warning', message: 'Nothing follows this step.' },
  ])
})

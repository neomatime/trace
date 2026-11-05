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

const ONLY_ONE_PATH = 'This decision has only one path out.'

test('merge gateway with two incoming and one outgoing flow does not warn', () => {
  const graph: ProcessGraph = {
    elements: [
      el('s', 'bpmn:StartEvent'),
      el('a', 'bpmn:Task'),
      el('b', 'bpmn:Task'),
      el('g', 'bpmn:ExclusiveGateway'),
      el('e', 'bpmn:EndEvent'),
    ],
    edges: [edge('1', 's', 'a'), edge('2', 's', 'b'), edge('3', 'a', 'g'), edge('4', 'b', 'g'), edge('5', 'g', 'e')],
  }
  assert.equal(validateGraph(graph).some((i) => i.message === ONLY_ONE_PATH), false)
})

test('pass-through gateway with one incoming and one outgoing flow warns', () => {
  const graph: ProcessGraph = {
    elements: [el('s', 'bpmn:StartEvent'), el('g', 'bpmn:ExclusiveGateway'), el('e', 'bpmn:EndEvent')],
    edges: [edge('1', 's', 'g'), edge('2', 'g', 'e')],
  }
  assert.deepEqual(validateGraph(graph), [{ elementId: 'g', severity: 'warning', message: ONLY_ONE_PATH }])
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

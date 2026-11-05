import test from 'node:test'
import assert from 'node:assert/strict'
import { diffGraphs, relinkReplaced, uncoveredPainPoints } from '../modules/process-flows/diff.ts'
import type { ProcessEdge, ProcessElement, ProcessGraph } from '../types/process-flow.ts'

function el(
  id: string,
  bpmnType = 'bpmn:Task',
  audit: Partial<ProcessElement['audit']> = {},
  extra: Partial<ProcessElement> = {},
): ProcessElement {
  return { id, bpmnType, name: id, audit: { evidenceIds: [], ...audit }, ...extra }
}

function edge(id: string, sourceId: string, targetId: string): ProcessEdge {
  return { id, sourceId, targetId, kind: 'sequence' }
}

const graph = (elements: ProcessElement[], edges: ProcessEdge[] = []): ProcessGraph => ({ elements, edges })

const ids = (list: readonly { id: string }[]) => list.map((x) => x.id)

test('identical graphs are all unchanged', () => {
  const g = graph([el('a'), el('b')], [edge('e1', 'a', 'b')])
  const d = diffGraphs(g, g)
  assert.deepEqual(ids(d.unchanged), ['a', 'b'])
  assert.deepEqual(d.removed, [])
  assert.deepEqual(d.added, [])
  assert.deepEqual(d.changed, [])
  assert.deepEqual(d.flowsAdded, [])
  assert.deepEqual(d.flowsRemoved, [])
})

test('element only in As-Is is removed, only in To-Be is added', () => {
  const d = diffGraphs(graph([el('a'), el('gone')]), graph([el('a'), el('new')]))
  assert.deepEqual(ids(d.removed), ['gone'])
  assert.deepEqual(ids(d.added), ['new'])
  assert.deepEqual(ids(d.unchanged), ['a'])
  assert.deepEqual(d.changed, [])
})

test('changed lists exactly the differing fields (e.g. bpmnType + waitMinutes)', () => {
  const before = el('a', 'bpmn:ManualTask', { waitMinutes: 60 })
  const after = el('a', 'bpmn:ServiceTask', { waitMinutes: 5 })
  const d = diffGraphs(graph([before]), graph([after]))
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].id, 'a')
  assert.equal(d.changed[0].before, before)
  assert.equal(d.changed[0].after, after)
  assert.deepEqual(d.changed[0].fields, ['bpmnType', 'waitMinutes'])
  assert.deepEqual(d.unchanged, [])
})

test('audit-field change counts as changed', () => {
  const d = diffGraphs(
    graph([el('a', 'bpmn:Task', { owner: 'Ann', painPoint: 'slow' })]),
    graph([el('a', 'bpmn:Task', { owner: 'Bob', painPoint: undefined })], []),
  )
  assert.deepEqual(ids(d.changed), ['a'])
  assert.deepEqual(d.changed[0].fields, ['owner', 'painPoint'])
  assert.deepEqual(d.unchanged, [])
})

test('name, laneId and the remaining audit fields are detected in union order', () => {
  const before = el('a', 'bpmn:Task', { system: 's1', input: 'i1', output: 'o1', workMinutes: 1, approvalRequired: false, control: 'c1' }, { name: 'n1', laneId: 'L1' })
  const after = el('a', 'bpmn:Task', { system: 's2', input: 'i2', output: 'o2', workMinutes: 2, approvalRequired: true, control: 'c2' }, { name: 'n2', laneId: 'L2' })
  const d = diffGraphs(graph([before]), graph([after]))
  assert.deepEqual(d.changed[0].fields, [
    'name', 'laneId', 'system', 'input', 'output', 'workMinutes', 'approvalRequired', 'control',
  ])
})

test('flows added/removed matched by source->target', () => {
  const asIs = graph([], [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')])
  const toBe = graph([], [edge('x9', 'a', 'b'), edge('e3', 'b', 'd')])
  const d = diffGraphs(asIs, toBe)
  assert.deepEqual(ids(d.flowsRemoved), ['e2'])
  assert.deepEqual(ids(d.flowsAdded), ['e3'])
})

test('relinkReplaced pairs a removed and an added element as changed', () => {
  const old = el('old', 'bpmn:ManualTask', { owner: 'Ann' })
  const next = el('next', 'bpmn:ServiceTask', { owner: 'Ann' })
  const d = diffGraphs(graph([el('keep'), old]), graph([el('keep'), next]))
  const r = relinkReplaced(d, 'old', 'next')
  assert.deepEqual(r.removed, [])
  assert.deepEqual(r.added, [])
  assert.deepEqual(ids(r.unchanged), ['keep'])
  assert.equal(r.changed.length, 1)
  assert.equal(r.changed[0].before, old)
  assert.equal(r.changed[0].after, next)
  assert.equal(r.changed[0].id, 'next')
  assert.deepEqual(r.changed[0].fields, ['bpmnType', 'name'])
})

test('relinkReplaced with unknown ids returns the diff unchanged', () => {
  const d = diffGraphs(graph([el('old')]), graph([el('next')]))
  assert.equal(relinkReplaced(d, 'nope', 'next'), d)
  assert.equal(relinkReplaced(d, 'old', 'nope'), d)
  assert.equal(relinkReplaced(d, 'next', 'old'), d)
})

test('uncoveredPainPoints returns elements whose pain point survives, not removed or cleared ones', () => {
  const asIs = graph([
    el('survives', 'bpmn:Task', { painPoint: 'slow' }),
    el('removed', 'bpmn:Task', { painPoint: 'manual' }),
    el('cleared', 'bpmn:Task', { painPoint: 'errors' }),
    el('blank', 'bpmn:Task', { painPoint: '' }),
    el('none'),
  ])
  const toBe = graph([
    el('survives', 'bpmn:Task', { painPoint: 'still slow' }),
    el('cleared', 'bpmn:Task', { painPoint: '' }),
    el('blank', 'bpmn:Task', { painPoint: 'new' }),
    el('none', 'bpmn:Task', { painPoint: 'new' }),
  ])
  const result = uncoveredPainPoints(asIs, toBe)
  assert.deepEqual(ids(result), ['survives'])
  assert.equal(result[0], asIs.elements[0])
})

test('diff of two empty graphs is all empty', () => {
  const empty = graph([])
  assert.deepEqual(diffGraphs(empty, empty), {
    removed: [], added: [], changed: [], unchanged: [], flowsAdded: [], flowsRemoved: [],
  })
  assert.deepEqual(uncoveredPainPoints(empty, empty), [])
})

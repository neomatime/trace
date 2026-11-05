import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCompareModel,
  describeChange,
  formatDelta,
  formatDuration,
  summarizeGaps,
} from '../modules/process-flows/compare-model.ts'
import { diffGraphs } from '../modules/process-flows/diff.ts'
import type { ProcessEdge, ProcessElement, ProcessGraph } from '../types/process-flow.ts'

function el(
  id: string,
  name: string,
  bpmnType = 'bpmn:Task',
  audit: Partial<ProcessElement['audit']> = {},
  laneId?: string,
): ProcessElement {
  return { id, bpmnType, name, ...(laneId ? { laneId } : {}), audit: { evidenceIds: [], ...audit } }
}

const edge = (id: string, sourceId: string, targetId: string): ProcessEdge => ({
  id,
  sourceId,
  targetId,
  kind: 'sequence',
})

const graph = (elements: ProcessElement[], edges: ProcessEdge[] = []): ProcessGraph => ({ elements, edges })

// A small P2P-like pair.
//  - Rekey: manual, pain point "duplicate typing", removed in the To-Be
//  - Review: manual task becomes a service task, wait 1 day -> 0
//  - Approve: pain point survives
//  - Capture: untouched
//  - Auto: new step with a control
const asIs = graph(
  [
    el('Capture', 'Capture requisition', 'bpmn:UserTask', { workMinutes: 15 }, 'L1'),
    el('Rekey', 'Re-key into ERP', 'bpmn:ManualTask', { painPoint: 'duplicate typing', workMinutes: 30 }, 'L1'),
    el('Review', 'Review requisition', 'bpmn:ManualTask', { waitMinutes: 1440, workMinutes: 10 }, 'L2'),
    el('Approve', 'Approve order', 'bpmn:UserTask', { painPoint: 'slow sign-off', approvalRequired: true }, 'L2'),
  ],
  [edge('e1', 'Capture', 'Rekey'), edge('e2', 'Rekey', 'Review'), edge('e3', 'Review', 'Approve')],
)

const toBe = graph(
  [
    el('Capture', 'Capture requisition', 'bpmn:UserTask', { workMinutes: 15 }, 'L1'),
    el('Review', 'Review requisition', 'bpmn:ServiceTask', { waitMinutes: 0, workMinutes: 10 }, 'L2'),
    el('Approve', 'Approve order', 'bpmn:UserTask', { painPoint: 'slow sign-off', approvalRequired: true }, 'L2'),
    el('Auto', 'Auto-match invoice', 'bpmn:ServiceTask', { control: 'three-way match' }, 'L2'),
  ],
  [edge('e1', 'Capture', 'Review'), edge('e3', 'Review', 'Approve'), edge('e4', 'Approve', 'Auto')],
)

test('states cover every element id in either graph', () => {
  const model = buildCompareModel(asIs, toBe)
  assert.deepEqual(model.states, {
    Capture: 'unchanged',
    Rekey: 'removed',
    Review: 'changed',
    Approve: 'unchanged',
    Auto: 'added',
  })
  assert.deepEqual(model.removedIds, ['Rekey'])
})

test('rows are ordered removed, changed, added, then not-addressed with exact text', () => {
  const { rows } = buildCompareModel(asIs, toBe)
  assert.deepEqual(
    rows.map((r) => [r.kind, r.title, r.detail, r.elementId]),
    [
      ['removed', 'Re-key into ERP', 'Removed — fixes pain point "duplicate typing"', 'Rekey'],
      ['changed', 'Review requisition', 'Manual task → Service task · wait 1 day → 0', 'Review'],
      ['added', 'Auto-match invoice', 'New step in the To-Be · new control: three-way match', 'Auto'],
      ['not-addressed', 'Approve order', 'Pain point "slow sign-off" is still in the To-Be', 'Approve'],
    ],
  )
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'row ids are unique')
})

test('a removed step without a pain point and an added step without a control use the plain wording', () => {
  const a = graph([el('x', 'Old step')])
  const b = graph([el('y', 'New step')])
  const { rows } = buildCompareModel(a, b)
  assert.deepEqual(
    rows.map((r) => [r.kind, r.detail]),
    [
      ['removed', 'Removed from the process'],
      ['added', 'New step in the To-Be'],
    ],
  )
})

test('metrics, delta and pain point coverage come from the two graphs', () => {
  const model = buildCompareModel(asIs, toBe)
  assert.deepEqual(model.metrics.asIs, {
    steps: 4,
    manualSteps: 4,
    handoffs: 1,
    approvals: 1,
    workMinutes: 55,
    waitMinutes: 1440,
  })
  assert.deepEqual(model.metrics.toBe, {
    steps: 4,
    manualSteps: 2,
    handoffs: 1, // Capture (L1) -> Review (L2)
    approvals: 1,
    workMinutes: 25,
    waitMinutes: 0,
  })
  assert.deepEqual(model.metrics.delta, {
    steps: 0,
    manualSteps: -2,
    handoffs: 0,
    approvals: 0,
    workMinutes: -30,
    waitMinutes: -1440,
  })
  assert.deepEqual(model.painPoints, { addressed: 1, total: 2 })
})

test('pairing a removed step with an added one shows a single changed row', () => {
  const model = buildCompareModel(asIs, toBe, [{ removedId: 'Rekey', addedId: 'Auto' }])
  assert.equal(model.states.Auto, 'changed')
  assert.equal('Rekey' in model.states, false)
  assert.deepEqual(model.removedIds, [])
  assert.deepEqual(
    model.rows.map((r) => [r.kind, r.elementId]),
    [
      ['changed', 'Review'],
      ['changed', 'Auto'],
      ['not-addressed', 'Approve'],
    ],
  )
  const paired = model.rows.find((r) => r.elementId === 'Auto')
  assert.equal(paired?.title, 'Auto-match invoice')
  assert.match(paired?.detail ?? '', /Manual task → Service task/)
})

test('a pairing that names unknown ids is ignored', () => {
  const plain = buildCompareModel(asIs, toBe)
  const model = buildCompareModel(asIs, toBe, [{ removedId: 'nope', addedId: 'Auto' }])
  assert.deepEqual(model, plain)
})

test('identical graphs give no differences and every element unchanged', () => {
  const model = buildCompareModel(asIs, asIs)
  assert.equal(model.rows.filter((r) => r.kind !== 'not-addressed').length, 0)
  assert.ok(Object.values(model.states).every((s) => s === 'unchanged'))
  assert.deepEqual(model.removedIds, [])
  assert.deepEqual(model.metrics.delta, {
    steps: 0,
    manualSteps: 0,
    handoffs: 0,
    approvals: 0,
    workMinutes: 0,
    waitMinutes: 0,
  })
  // both pain points are untouched, so both are still open
  assert.deepEqual(model.painPoints, { addressed: 0, total: 2 })
})

test('identical graphs without pain points have no rows at all', () => {
  const g = graph([el('a', 'A'), el('b', 'B')], [edge('e', 'a', 'b')])
  const model = buildCompareModel(g, g)
  assert.deepEqual(model.rows, [])
  assert.deepEqual(model.states, { a: 'unchanged', b: 'unchanged' })
  assert.deepEqual(model.painPoints, { addressed: 0, total: 0 })
})

test('empty graphs give empty rows, zero metrics and no NaN', () => {
  const empty = graph([])
  const model = buildCompareModel(empty, empty)
  assert.deepEqual(model.rows, [])
  assert.deepEqual(model.states, {})
  assert.deepEqual(model.removedIds, [])
  assert.deepEqual(model.painPoints, { addressed: 0, total: 0 })
  for (const side of [model.metrics.asIs, model.metrics.toBe, model.metrics.delta]) {
    for (const value of Object.values(side)) assert.equal(value, 0)
  }
  assert.equal(formatDelta(model.metrics.asIs.steps, model.metrics.toBe.steps), '0 → 0')
})

test('an empty To-Be removes everything and addresses every pain point', () => {
  const model = buildCompareModel(asIs, graph([]))
  assert.deepEqual(
    model.rows.map((r) => r.kind),
    ['removed', 'removed', 'removed', 'removed'],
  )
  assert.deepEqual(model.painPoints, { addressed: 2, total: 2 })
  assert.equal(model.metrics.toBe.steps, 0)
})

test('formatDuration uses minutes, hours and days at the boundaries', () => {
  assert.equal(formatDuration(0), '0')
  assert.equal(formatDuration(45), '45 min')
  assert.equal(formatDuration(59), '59 min')
  assert.equal(formatDuration(60), '1 h')
  assert.equal(formatDuration(180), '3 h')
  assert.equal(formatDuration(90), '1.5 h')
  assert.equal(formatDuration(1439), '24 h')
  assert.equal(formatDuration(1440), '1 day')
  assert.equal(formatDuration(2880), '2 days')
})

test('formatDelta joins the two values with an arrow', () => {
  assert.equal(formatDelta(7, 5), '7 → 5')
  assert.equal(formatDelta(0, 0), '0 → 0')
  assert.equal(formatDelta(1200, 3), '1,200 → 3')
  assert.equal(formatDelta(59, 60, 'min'), '59 min → 1 h')
  assert.equal(formatDelta(1439, 1440, 'min'), '24 h → 1 day')
  assert.equal(formatDelta(1440, 120, 'min'), '1 day → 2 h')
  assert.equal(formatDelta(2880, 0, 'min'), '2 days → 0')
  assert.equal(formatDelta(0, 0, 'min'), '0 → 0')
})

test('describeChange explains a type and wait-time change in plain English', () => {
  const change = diffGraphs(asIs, toBe).changed.find((c) => c.id === 'Review')
  assert.ok(change)
  assert.equal(describeChange(change), 'Manual task → Service task · wait 1 day → 0')
})

test('describeChange names the other fields', () => {
  const before = el('a', 'Check', 'bpmn:Task', { owner: 'AP clerk', painPoint: 'slow', approvalRequired: false }, 'L1')
  const after = el(
    'a',
    'Check invoice',
    'bpmn:Task',
    { owner: 'Finance', system: 'ERP', control: 'match', approvalRequired: true, workMinutes: 90 },
    'L2',
  )
  const change = diffGraphs(graph([before]), graph([after])).changed[0]
  assert.equal(
    describeChange(change, { before: { L1: 'Clerk' }, after: { L2: 'Finance' } }),
    [
      'name "Check" → "Check invoice"',
      'lane Clerk → Finance',
      'owner AP clerk → Finance',
      'system none → ERP',
      'work none → 1.5 h',
      'approval not required → required',
      'control none → match',
      'pain point "slow" → none',
    ].join(' · '),
  )
})

function laneChange(beforeLane: string | undefined, afterLane: string | undefined) {
  const a = el('a', 'Check', 'bpmn:Task', {}, beforeLane)
  const b = el('a', 'Check', 'bpmn:Task', {}, afterLane)
  return diffGraphs(graph([a]), graph([b])).changed[0]
}

test('lane changes read with lane names from the matching graph', () => {
  const change = laneChange('Lane_LineManager', 'Lane_Finance')
  const names = { before: { Lane_LineManager: 'Line Manager' }, after: { Lane_Finance: 'Finance' } }
  assert.equal(describeChange(change, names), 'lane Line Manager → Finance')
})

test('an unnamed seeded lane id is tidied and never shows the raw id', () => {
  assert.equal(describeChange(laneChange('Lane_LineManager', 'Lane_Finance')), 'lane Line Manager → Finance')
  assert.equal(describeChange(laneChange('Lane_Credit_control', 'Lane_Finance')), 'lane Credit Control → Finance')
})

test('an opaque generated lane id reads as an unnamed lane', () => {
  assert.equal(describeChange(laneChange('Lane_1x9k2q', 'Lane_0abc123')), 'lane an unnamed lane → an unnamed lane')
  assert.equal(describeChange(laneChange('Lane_1x9k2q', 'Lane_Finance')), 'lane an unnamed lane → Finance')
})

test('a lane that was added or removed reads sensibly', () => {
  const names = { before: { Lane_Finance: 'Finance' }, after: { Lane_Finance: 'Finance' } }
  assert.equal(describeChange(laneChange(undefined, 'Lane_Finance'), names), 'lane no lane → Finance')
  assert.equal(describeChange(laneChange('Lane_Finance', undefined), names), 'lane Finance → no lane')
})

test("buildCompareModel uses each graph's own lane names", () => {
  const a: ProcessGraph = { ...graph([el('t', 'Task', 'bpmn:Task', {}, 'L1')]), laneNames: { L1: 'Clerk' } }
  const b: ProcessGraph = { ...graph([el('t', 'Task', 'bpmn:Task', {}, 'L2')]), laneNames: { L2: 'Finance' } }
  assert.equal(buildCompareModel(a, b).rows[0].detail, 'lane Clerk → Finance')
})

test('summarizeGaps counts each kind and pluralises', () => {
  const { rows } = buildCompareModel(asIs, toBe)
  assert.equal(summarizeGaps(rows), '1 removed, 1 changed, 1 added, 1 pain point not addressed')
  assert.equal(summarizeGaps(buildCompareModel(asIs, graph([])).rows), '4 removed')
  assert.equal(summarizeGaps(buildCompareModel(asIs, asIs).rows), '2 pain points not addressed')
  assert.equal(summarizeGaps([]), 'No differences yet')
})

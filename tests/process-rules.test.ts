import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_HANDOFFS,
  PROCESS_RULES,
  WAIT_THRESHOLD_MINUTES,
  decideSuggestion,
  orderForImplementation,
  runRules,
  toRecommendationDraft,
} from '../modules/process-flows/rules.ts'
import type { AuditFields, ProcessEdge, ProcessElement, ProcessGraph, ProcessSuggestion } from '../types/process-flow.ts'

function el(
  id: string,
  bpmnType: string,
  audit: Partial<AuditFields> = {},
  extra: Partial<ProcessElement> = {},
): ProcessElement {
  return { id, bpmnType, name: id, audit: { evidenceIds: [], ...audit }, ...extra }
}

function edge(id: string, sourceId: string, targetId: string): ProcessEdge {
  return { id, sourceId, targetId, kind: 'sequence' }
}

const empty: ProcessGraph = { elements: [], edges: [] }

function ruleIds(toBe: ProcessGraph): string[] {
  return runRules(empty, toBe).map((d) => d.ruleId ?? '')
}

function suggestion(id: string, over: Partial<ProcessSuggestion> = {}): ProcessSuggestion {
  return {
    id,
    processFlowId: 'f1',
    source: 'rule',
    ruleId: 'r',
    title: id,
    rationale: 'why',
    expectedOutcome: 'outcome',
    elementIds: [],
    dependsOn: [],
    priority: 'Medium',
    effort: 'Medium',
    status: 'Proposed',
    ...over,
  }
}

test('constants hold the placeholder thresholds and rules are registered', () => {
  assert.equal(WAIT_THRESHOLD_MINUTES, 4320)
  assert.equal(MAX_HANDOFFS, 5)
  assert.deepEqual(
    PROCESS_RULES.map((r) => r.id),
    ['manual-rekeying', 'long-wait', 'duplicate-approvals', 'missing-payment-control', 'excessive-handoffs'],
  )
})

test('empty To-Be yields no suggestions', () => {
  assert.deepEqual(runRules(empty, empty), [])
})

test('manual-rekeying flags a manual task fed from a different system', () => {
  const toBe: ProcessGraph = {
    elements: [
      el('a', 'bpmn:ServiceTask', { system: 'ERP' }),
      el('g', 'bpmn:ExclusiveGateway'),
      el('m', 'bpmn:ManualTask', { system: 'Excel' }),
    ],
    edges: [edge('1', 'a', 'g'), edge('2', 'g', 'm')],
  }
  const drafts = runRules(empty, toBe).filter((d) => d.ruleId === 'manual-rekeying')
  assert.equal(drafts.length, 1)
  assert.deepEqual(drafts[0].elementIds, ['m'])
  assert.equal(drafts[0].priority, 'High')
  assert.equal(drafts[0].effort, 'Medium')
  assert.equal(drafts[0].source, 'rule')
  assert.deepEqual(drafts[0].dependsOn, [])
})

test('manual-rekeying ignores same system, missing system and non-manual tasks', () => {
  const same: ProcessGraph = {
    elements: [el('a', 'bpmn:Task', { system: 'ERP' }), el('m', 'bpmn:ManualTask', { system: 'ERP' })],
    edges: [edge('1', 'a', 'm')],
  }
  const noSystem: ProcessGraph = {
    elements: [el('a', 'bpmn:Task', { system: 'ERP' }), el('m', 'bpmn:ManualTask')],
    edges: [edge('1', 'a', 'm')],
  }
  const notManual: ProcessGraph = {
    elements: [el('a', 'bpmn:Task', { system: 'ERP' }), el('m', 'bpmn:UserTask', { system: 'Excel' })],
    edges: [edge('1', 'a', 'm')],
  }
  assert.equal(ruleIds(same).includes('manual-rekeying'), false)
  assert.equal(ruleIds(noSystem).includes('manual-rekeying'), false)
  assert.equal(ruleIds(notManual).includes('manual-rekeying'), false)
})

test('long-wait fires above the threshold', () => {
  const toBe: ProcessGraph = {
    elements: [el('w', 'bpmn:Task', { waitMinutes: WAIT_THRESHOLD_MINUTES + 1 })],
    edges: [],
  }
  const drafts = runRules(empty, toBe).filter((d) => d.ruleId === 'long-wait')
  assert.equal(drafts.length, 1)
  assert.deepEqual(drafts[0].elementIds, ['w'])
  assert.equal(drafts[0].priority, 'High')
  assert.equal(drafts[0].effort, 'Low')
})

test('long-wait does not fire at exactly the threshold', () => {
  const toBe: ProcessGraph = {
    elements: [el('w', 'bpmn:Task', { waitMinutes: WAIT_THRESHOLD_MINUTES })],
    edges: [],
  }
  assert.equal(ruleIds(toBe).includes('long-wait'), false)
})

test('duplicate-approvals flags consecutive approval steps', () => {
  const toBe: ProcessGraph = {
    elements: [el('a', 'bpmn:UserTask', { approvalRequired: true }), el('b', 'bpmn:UserTask', { approvalRequired: true })],
    edges: [edge('1', 'a', 'b')],
  }
  const drafts = runRules(empty, toBe).filter((d) => d.ruleId === 'duplicate-approvals')
  assert.equal(drafts.length, 1)
  assert.deepEqual(drafts[0].elementIds, ['a', 'b'])
  assert.equal(drafts[0].priority, 'Medium')
  assert.equal(drafts[0].effort, 'Low')
})

test('duplicate-approvals ignores approvals separated by a non-approval step', () => {
  const toBe: ProcessGraph = {
    elements: [
      el('a', 'bpmn:UserTask', { approvalRequired: true }),
      el('x', 'bpmn:Task'),
      el('b', 'bpmn:UserTask', { approvalRequired: true }),
    ],
    edges: [edge('1', 'a', 'x'), edge('2', 'x', 'b')],
  }
  assert.equal(ruleIds(toBe).includes('duplicate-approvals'), false)
})

test('missing-payment-control flags a payment step without a control', () => {
  const toBe: ProcessGraph = { elements: [el('p', 'bpmn:Task', {}, { name: 'Release payment' })], edges: [] }
  const drafts = runRules(empty, toBe).filter((d) => d.ruleId === 'missing-payment-control')
  assert.equal(drafts.length, 1)
  assert.deepEqual(drafts[0].elementIds, ['p'])
  assert.equal(drafts[0].priority, 'Critical')
  assert.equal(drafts[0].effort, 'Medium')
})

test('missing-payment-control ignores controlled payments and unrelated names', () => {
  const controlled: ProcessGraph = {
    elements: [el('p', 'bpmn:Task', { control: 'Dual sign-off' }, { name: 'Release payment' })],
    edges: [],
  }
  const unrelated: ProcessGraph = { elements: [el('u', 'bpmn:Task', {}, { name: 'File invoice' })], edges: [] }
  assert.equal(ruleIds(controlled).includes('missing-payment-control'), false)
  assert.equal(ruleIds(unrelated).includes('missing-payment-control'), false)
})

function laneChain(handoffs: number): ProcessGraph {
  const elements: ProcessElement[] = []
  const edges: ProcessEdge[] = []
  for (let i = 0; i <= handoffs; i += 1) {
    elements.push(el(`t${i}`, 'bpmn:Task', {}, { laneId: `lane${i}` }))
    if (i > 0) edges.push(edge(`e${i}`, `t${i - 1}`, `t${i}`))
  }
  return { elements, edges }
}

test('excessive-handoffs fires above the maximum', () => {
  const drafts = runRules(empty, laneChain(MAX_HANDOFFS + 1)).filter((d) => d.ruleId === 'excessive-handoffs')
  assert.equal(drafts.length, 1)
  assert.equal(drafts[0].priority, 'Medium')
  assert.equal(drafts[0].effort, 'High')
})

test('excessive-handoffs does not fire at the maximum', () => {
  assert.equal(ruleIds(laneChain(MAX_HANDOFFS)).includes('excessive-handoffs'), false)
})

test('every draft has a title, rationale and expected outcome', () => {
  const toBe: ProcessGraph = {
    elements: [
      el('a', 'bpmn:ServiceTask', { system: 'ERP', waitMinutes: 99999, approvalRequired: true }, { laneId: 'x' }),
      el('m', 'bpmn:ManualTask', { system: 'Excel', approvalRequired: true }, { name: 'Pay supplier', laneId: 'y' }),
    ],
    edges: [edge('1', 'a', 'm')],
  }
  const drafts = runRules(empty, toBe)
  assert.equal(drafts.length >= 4, true)
  for (const d of drafts) {
    assert.notEqual(d.title.trim(), '')
    assert.notEqual(d.rationale.trim(), '')
    assert.notEqual(d.expectedOutcome.trim(), '')
  }
})

test('decideSuggestion sets status, decidedBy, decidedAt and does not mutate input', () => {
  const original = suggestion('s1')
  const snapshot = structuredClone(original)
  const decided = decideSuggestion(original, 'Accepted', 'u1', '2026-11-05T10:00:00.000Z')
  assert.equal(decided.status, 'Accepted')
  assert.equal(decided.decidedBy, 'u1')
  assert.equal(decided.decidedAt, '2026-11-05T10:00:00.000Z')
  assert.notEqual(decided, original)
  assert.deepEqual(original, snapshot)
})

test('toRecommendationDraft throws for Proposed and Rejected', () => {
  assert.throws(() => toRecommendationDraft(suggestion('a', { status: 'Proposed' })))
  assert.throws(() => toRecommendationDraft(suggestion('b', { status: 'Rejected' })))
})

test('toRecommendationDraft maps Accepted and Edited suggestions', () => {
  const s = suggestion('a', {
    status: 'Edited',
    title: 'T',
    expectedOutcome: 'O',
    priority: 'High',
    effort: 'Low',
    dependsOn: ['x'],
  })
  assert.deepEqual(toRecommendationDraft(s), {
    title: 'T',
    expectedOutcome: 'O',
    priority: 'High',
    estimatedEffort: 'Low',
    dependencies: ['x'],
  })
  assert.equal(toRecommendationDraft({ ...s, status: 'Accepted' }).title, 'T')
})

test('orderForImplementation puts a low-priority dependency before its dependent', () => {
  const critical = suggestion('critical', { priority: 'Critical', dependsOn: ['low'] })
  const low = suggestion('low', { priority: 'Low' })
  const high = suggestion('high', { priority: 'High' })
  const input = [critical, low, high]
  const ordered = orderForImplementation(input).map((s) => s.id)
  assert.deepEqual(ordered, ['high', 'low', 'critical'])
  assert.deepEqual(input.map((s) => s.id), ['critical', 'low', 'high'])
})

test('orderForImplementation orders by priority then effort and ignores unknown dependencies', () => {
  const a = suggestion('a', { priority: 'Medium', effort: 'High' })
  const b = suggestion('b', { priority: 'Medium', effort: 'Low', dependsOn: ['missing'] })
  const c = suggestion('c', { priority: 'High', effort: 'Very High' })
  assert.deepEqual(orderForImplementation([a, b, c]).map((s) => s.id), ['c', 'b', 'a'])
})

test('orderForImplementation survives a dependency cycle', () => {
  const a = suggestion('a', { priority: 'Low', dependsOn: ['b'] })
  const b = suggestion('b', { priority: 'High', dependsOn: ['a'] })
  const ordered = orderForImplementation([a, b])
  assert.equal(ordered.length, 2)
  assert.deepEqual(ordered.map((s) => s.id).sort(), ['a', 'b'])
})

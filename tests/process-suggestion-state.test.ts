import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMPTY_SUGGESTION_STORE,
  applyDecision,
  canCreateRecommendation,
  canDecide,
  markRecommendationCreated,
  mergeSuggestions,
  suggestionId,
  summarise,
} from '../modules/process-flows/suggestion-state.ts'
import { orderForImplementation, runRules } from '../modules/process-flows/rules.ts'
import type { SuggestionDraft } from '../modules/process-flows/rules.ts'
import type { AuditFields, ProcessElement, ProcessGraph, ProcessSuggestion } from '../types/process-flow.ts'
import { USER_ROLES } from '../types/user.ts'

const NOW = '2026-11-05T10:00:00.000Z'

function draft(over: Partial<SuggestionDraft> = {}): SuggestionDraft {
  return {
    source: 'rule',
    ruleId: 'long-wait',
    title: 'Reduce the wait',
    rationale: 'why',
    expectedOutcome: 'faster',
    elementIds: ['b', 'a'],
    dependsOn: [],
    priority: 'High',
    effort: 'Low',
    ...over,
  }
}

function demo(id: string, over: Partial<ProcessSuggestion> = {}): ProcessSuggestion {
  return {
    id,
    processFlowId: 'pf',
    source: 'ai',
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

function el(id: string, audit: Partial<AuditFields> = {}): ProcessElement {
  return { id, bpmnType: 'bpmn:Task', name: id, audit: { evidenceIds: [], ...audit } }
}

const store = EMPTY_SUGGESTION_STORE

test('suggestionId is deterministic and ignores elementIds order', () => {
  const a = suggestionId(draft({ elementIds: ['b', 'a'] }))
  const b = suggestionId(draft({ elementIds: ['a', 'b'] }))
  assert.equal(a, 'rule:long-wait:a,b')
  assert.equal(a, b)
  assert.equal(suggestionId(draft()), suggestionId(draft()))
})

test('suggestionId distinguishes rules and elements, and honours a key', () => {
  assert.notEqual(suggestionId(draft({ ruleId: 'x' })), suggestionId(draft()))
  assert.notEqual(suggestionId(draft({ elementIds: ['a'] })), suggestionId(draft()))
  assert.notEqual(suggestionId({ ...draft(), key: 'k' }), suggestionId(draft()))
})

test('mergeSuggestions gives rule drafts deterministic ids and Proposed status', () => {
  const merged = mergeSuggestions('pf', [draft()], [], store)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'rule:long-wait:a,b')
  assert.equal(merged[0].status, 'Proposed')
  assert.equal(merged[0].processFlowId, 'pf')
  assert.equal(merged[0].decidedBy, undefined)
})

test('mergeSuggestions applies stored decisions and edits', () => {
  const id = 'rule:long-wait:a,b'
  const decided = applyDecision(store, id, 'Edited', 'u1', NOW, { title: 'New title', priority: 'Low' })
  const [item] = mergeSuggestions('pf', [draft()], [], decided)
  assert.equal(item.status, 'Edited')
  assert.equal(item.decidedBy, 'u1')
  assert.equal(item.decidedAt, NOW)
  assert.equal(item.title, 'New title')
  assert.equal(item.priority, 'Low')
  assert.equal(item.effort, 'Low') // untouched field kept
  assert.equal(item.rationale, 'why')
})

test('mergeSuggestions applies decisions to AI demo items', () => {
  const decided = applyDecision(store, 'ai-1', 'Accepted', 'u1', NOW)
  const items = mergeSuggestions('pf', [], [demo('ai-1')], decided)
  assert.equal(items[0].status, 'Accepted')
  assert.equal(items[0].source, 'ai')
})

test('mergeSuggestions ignores stored decisions for vanished ids', () => {
  const decided = applyDecision(store, 'rule:gone:z', 'Rejected', 'u1', NOW)
  const items = mergeSuggestions('pf', [draft()], [demo('ai-1')], decided)
  assert.equal(items.length, 2)
  assert.ok(items.every((i) => i.status === 'Proposed'))
})

test('AI demo supplied as Accepted is forced to source ai and Proposed', () => {
  const sneaky = demo('ai-1', { status: 'Accepted', decidedBy: 'x', decidedAt: NOW, source: 'rule' })
  const [item] = mergeSuggestions('pf', [], [sneaky], store)
  assert.equal(item.status, 'Proposed')
  assert.equal(item.source, 'ai')
  assert.equal(item.decidedBy, undefined)
  assert.equal(item.decidedAt, undefined)
})

test('applyDecision is immutable', () => {
  const before = JSON.stringify(store)
  const next = applyDecision(store, 'a', 'Accepted', 'u1', NOW)
  assert.equal(JSON.stringify(store), before)
  assert.notEqual(next, store)
  assert.equal(next.decisions.a.status, 'Accepted')
  const again = applyDecision(next, 'b', 'Rejected', 'u1', NOW)
  assert.equal(next.decisions.b, undefined)
  assert.equal(again.decisions.a.status, 'Accepted')
})

test('applyDecision: Edited without edits throws', () => {
  assert.throws(() => applyDecision(store, 'a', 'Edited', 'u1', NOW))
  assert.throws(() => applyDecision(store, 'a', 'Edited', 'u1', NOW, {}))
})

test('applyDecision: a later decision replaces the earlier one and drops stale edits', () => {
  const edited = applyDecision(store, 'a', 'Edited', 'u1', NOW, { title: 't' })
  const accepted = applyDecision(edited, 'a', 'Accepted', 'u2', NOW)
  assert.equal(accepted.decisions.a.status, 'Accepted')
  assert.equal(accepted.decisions.a.edits, undefined)
})

test('markRecommendationCreated is idempotent and immutable', () => {
  const once = markRecommendationCreated(store, 'a')
  const twice = markRecommendationCreated(once, 'a')
  assert.deepEqual(once.created, ['a'])
  assert.deepEqual(twice.created, ['a'])
  assert.deepEqual(store.created, [])
  assert.equal(twice, once)
})

test('canDecide and canCreateRecommendation follow the role matrix', () => {
  const decide: Record<string, boolean> = {
    Admin: true,
    'Audit Lead': true,
    'Auditor / Consultant': true,
    Reviewer: true,
    Viewer: false,
  }
  const create: Record<string, boolean> = {
    Admin: true,
    'Audit Lead': true,
    'Auditor / Consultant': true,
    Reviewer: false,
    Viewer: false,
  }
  for (const role of USER_ROLES) {
    assert.equal(canDecide(role), decide[role], `canDecide ${role}`)
    assert.equal(canCreateRecommendation(role), create[role], `canCreateRecommendation ${role}`)
  }
})

test('summarise counts each status', () => {
  const items = [
    demo('1'),
    demo('2'),
    demo('3', { status: 'Accepted' }),
    demo('4', { status: 'Edited' }),
    demo('5', { status: 'Rejected' }),
    demo('6', { status: 'Rejected' }),
  ]
  assert.deepEqual(summarise(items), { proposed: 2, accepted: 1, edited: 1, rejected: 2 })
  assert.deepEqual(summarise([]), { proposed: 0, accepted: 0, edited: 0, rejected: 0 })
})

test('rejected items are excluded from the ordered list', () => {
  const items = mergeSuggestions(
    'pf',
    [],
    [demo('a'), demo('b'), demo('c')],
    applyDecision(store, 'b', 'Rejected', 'u1', NOW),
  )
  const ordered = orderForImplementation(items.filter((i) => i.status !== 'Rejected'))
  assert.deepEqual(
    ordered.map((i) => i.id),
    ['a', 'c'],
  )
})

test('decisions survive a recompute where the same rule fires again', () => {
  const graph = (wait: number): ProcessGraph => ({ elements: [el('s1', { waitMinutes: wait })], edges: [] })
  const empty: ProcessGraph = { elements: [], edges: [] }
  const first = mergeSuggestions('pf', runRules(empty, graph(5000)), [], store)
  assert.equal(first.length, 1)
  const decided = applyDecision(store, first[0].id, 'Accepted', 'u1', NOW)
  const second = mergeSuggestions('pf', runRules(empty, graph(9000)), [], decided)
  assert.equal(second.length, 1)
  assert.equal(second[0].id, first[0].id)
  assert.equal(second[0].status, 'Accepted')
  // the rule stops firing: the card disappears, the decision is kept in the store
  const gone = mergeSuggestions('pf', runRules(empty, graph(10)), [], decided)
  assert.equal(gone.length, 0)
  const back = mergeSuggestions('pf', runRules(empty, graph(6000)), [], decided)
  assert.equal(back[0].status, 'Accepted')
})

test('an empty To-Be produces no rule suggestions and does not throw', () => {
  const empty: ProcessGraph = { elements: [], edges: [] }
  assert.deepEqual(mergeSuggestions('pf', runRules(empty, empty), [], store), [])
})

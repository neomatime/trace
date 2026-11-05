import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createReassessmentAsIs,
  createToBe,
  isLocked,
  nextStatus,
  reportBlockers,
} from '../modules/process-flows/lifecycle.ts'
import type { ProcessFlow, ProcessModelVersion } from '../types/process-flow.ts'

const NOW = '2026-11-05T10:00:00.000Z'

function model(overrides: Partial<ProcessModelVersion> = {}): ProcessModelVersion {
  return {
    id: 'm1',
    processFlowId: 'f1',
    kind: 'As-Is',
    version: 3,
    status: 'Approved',
    xml: '<bpmn/>',
    createdBy: 'u0',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastModifiedBy: 'u0',
    lastModifiedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  }
}

function flow(id: string, name: string): ProcessFlow {
  return {
    id,
    auditId: 'a1',
    assessmentId: 's1',
    name,
    createdBy: 'u0',
    createdAt: NOW,
    lastModifiedBy: 'u0',
    lastModifiedAt: NOW,
  }
}

test('follows the full happy path', () => {
  const a = nextStatus('Draft', 'submit')
  const b = nextStatus(a, 'approve-himark')
  const c = nextStatus(b, 'approve-client')
  assert.deepEqual([a, b, c], ['In Review', 'Awaiting Client', 'Approved'])
})

test('client approval before HIMARK approval throws', () => {
  assert.throws(() => nextStatus('In Review', 'approve-client'), /Invalid transition: In Review \+ approve-client/)
})

test('approving twice throws', () => {
  assert.throws(() => nextStatus('Awaiting Client', 'approve-himark'), /Invalid transition: Awaiting Client \+ approve-himark/)
})

test('approved models accept no action', () => {
  for (const action of ['submit', 'approve-himark', 'approve-client', 'reject'] as const) {
    assert.throws(() => nextStatus('Approved', action), /Invalid transition: Approved/)
  }
  assert.equal(isLocked('Approved'), true)
  assert.equal(isLocked('Draft'), false)
})

test('reject returns to Draft from both review states', () => {
  assert.equal(nextStatus('In Review', 'reject'), 'Draft')
  assert.equal(nextStatus('Awaiting Client', 'reject'), 'Draft')
})

test('createToBe copies xml, sets kind To-Be, version 1, status Draft, derivedFromId = asIs.id, same processFlowId', () => {
  const tobe = createToBe(model(), { id: 'm2', now: NOW, userId: 'u1' })
  assert.equal(tobe.id, 'm2')
  assert.equal(tobe.xml, '<bpmn/>')
  assert.equal(tobe.kind, 'To-Be')
  assert.equal(tobe.version, 1)
  assert.equal(tobe.status, 'Draft')
  assert.equal(tobe.derivedFromId, 'm1')
  assert.equal(tobe.processFlowId, 'f1')
  assert.equal(tobe.createdBy, 'u1')
  assert.equal(tobe.lastModifiedBy, 'u1')
  assert.equal(tobe.createdAt, NOW)
  assert.equal(tobe.lastModifiedAt, NOW)
})

test('createToBe refuses an As-Is that is not Approved', () => {
  assert.throws(() => createToBe(model({ status: 'Draft' }), { id: 'm2', now: NOW, userId: 'u1' }))
})

test('createToBe refuses a To-Be input', () => {
  assert.throws(() => createToBe(model({ kind: 'To-Be' }), { id: 'm2', now: NOW, userId: 'u1' }))
})

test('createReassessmentAsIs refuses a To-Be that is not Approved', () => {
  const tobe = model({ kind: 'To-Be', status: 'In Review' })
  assert.throws(() =>
    createReassessmentAsIs(tobe, { id: 'm3', processFlowId: 'f2', now: NOW, userId: 'u1' }),
  )
})

test('createReassessmentAsIs yields an As-Is Draft with derivedFromId set', () => {
  const tobe = model({ id: 'tb', kind: 'To-Be', status: 'Approved', version: 1 })
  const asIs = createReassessmentAsIs(tobe, { id: 'm3', processFlowId: 'f2', now: NOW, userId: 'u1' })
  assert.equal(asIs.id, 'm3')
  assert.equal(asIs.kind, 'As-Is')
  assert.equal(asIs.status, 'Draft')
  assert.equal(asIs.version, 1)
  assert.equal(asIs.derivedFromId, 'tb')
  assert.equal(asIs.processFlowId, 'f2')
  assert.equal(asIs.xml, '<bpmn/>')
  assert.equal(asIs.createdBy, 'u1')
  assert.equal(asIs.lastModifiedAt, NOW)
})

test('reportBlockers lists flows lacking an approved To-Be and is empty when all approved', () => {
  const approved = model({ kind: 'To-Be', status: 'Approved' })
  const draft = model({ kind: 'To-Be', status: 'Draft' })
  const blockers = reportBlockers([
    { flow: flow('f1', 'Onboarding'), toBe: approved },
    { flow: flow('f2', 'Payments'), toBe: draft },
    { flow: flow('f3', 'Refunds') },
  ])
  assert.deepEqual(blockers, ['"Payments" has no approved To-Be.', '"Refunds" has no approved To-Be.'])
  assert.deepEqual(reportBlockers([{ flow: flow('f1', 'Onboarding'), toBe: approved }]), [])
})

test('reportBlockers with no flows is empty', () => {
  assert.deepEqual(reportBlockers([]), [])
})

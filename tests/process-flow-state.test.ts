import test from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission } from '../lib/auth/permissions.ts'
import { emptyProcessXml } from '../lib/bpmn/graph.ts'
import {
  approveBlocker,
  approveModel,
  lockedReason,
  readiness,
  rejectModel,
  saveDraft,
  stageStates,
  startProcessMap,
  startToBe,
  submitBlocker,
  submitModel,
} from '../modules/process-flows/workspace-state.ts'
import type { Context, Transition, WorkspaceState } from '../modules/process-flows/workspace-state.ts'
import type { ProcessModelStatus, ProcessModelVersion } from '../types/process-flow.ts'
import type { UserRole } from '../types/user.ts'

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Defs_T" targetNamespace="http://himark.co.za/bpmn">
  <bpmn:process id="Proc_T" isExecutable="false">
    <bpmn:startEvent id="Start_1" name="Need" />
    <bpmn:task id="Task_1" name="Raise request" />
    <bpmn:endEvent id="End_1" name="Done" />
    <bpmn:sequenceFlow id="F1" sourceRef="Start_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task_1" targetRef="End_1" />
  </bpmn:process>
</bpmn:definitions>`

const EDITED_XML = VALID_XML.replace('Raise request', 'Raise purchase request')

function ctx(role: UserRole = 'Audit Lead', userId = 'u2'): Context {
  let seq = 0
  let minute = 0
  return {
    userId,
    role,
    now: () => `2026-11-05T10:${String(minute++).padStart(2, '0')}:00.000Z`,
    newId: (prefix) => `${prefix}-${++seq}`,
  }
}

function model(overrides: Partial<ProcessModelVersion> = {}): ProcessModelVersion {
  return {
    id: 'asis-1',
    processFlowId: 'flow-1',
    kind: 'As-Is',
    version: 1,
    status: 'Draft',
    xml: VALID_XML,
    createdBy: 'u2',
    createdAt: '2026-11-01T00:00:00.000Z',
    lastModifiedBy: 'u2',
    lastModifiedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

function seeded(asIs: Partial<ProcessModelVersion> = {}, toBe?: Partial<ProcessModelVersion>): WorkspaceState {
  return {
    flow: {
      id: 'flow-1',
      auditId: 'TRC-OF-2026-0012',
      assessmentId: 'asm-1',
      name: 'Purchase-to-Pay',
      createdBy: 'u2',
      createdAt: '2026-11-01T00:00:00.000Z',
      lastModifiedBy: 'u2',
      lastModifiedAt: '2026-11-01T00:00:00.000Z',
    },
    asIs: model(asIs),
    toBe: toBe ? model({ id: 'tobe-1', kind: 'To-Be', derivedFromId: 'asis-1', ...toBe }) : null,
    approvals: [],
  }
}

function ok(result: Transition): WorkspaceState {
  if (!result.ok) assert.fail(`expected success, got: ${result.error}`)
  return result.state
}

function fails(result: Transition): string {
  if (result.ok) assert.fail('expected the transition to be refused')
  assert.ok(result.error.trim().length > 0, 'error must be readable')
  return result.error
}

async function submitted(state: WorkspaceState, id: string, c: Context): Promise<Transition> {
  const xml = (state.asIs?.id === id ? state.asIs : state.toBe)?.xml ?? ''
  return submitModel(state, id, { xml, problem: await submitBlocker(xml) }, c)
}

test('happy path: submit, HIMARK approve, client approve creates a Draft To-Be', async () => {
  const c = ctx()
  let state = seeded()
  state = ok(await submitted(state, 'asis-1', c))
  assert.equal(state.asIs?.status, 'In Review')
  state = ok(approveModel(state, 'asis-1', 'HIMARK', c, 'approved on the call'))
  assert.equal(state.asIs?.status, 'Awaiting Client')
  assert.equal(state.toBe, null)
  const last = approveModel(state, 'asis-1', 'Client', c)
  state = ok(last)
  assert.equal(state.asIs?.status, 'Approved')
  assert.ok(state.toBe, 'a To-Be is created automatically')
  assert.equal(state.toBe.kind, 'To-Be')
  assert.equal(state.toBe.status, 'Draft')
  assert.equal(state.toBe.derivedFromId, 'asis-1')
  assert.equal(state.toBe.xml, state.asIs.xml)
  assert.ok(last.ok && last.createdToBe && last.createdToBe.id === state.toBe.id, 'the new To-Be is returned')
  assert.deepEqual(
    state.approvals.map((a) => [a.modelVersionId, a.party, a.decision, a.byUserId, a.note]),
    [
      ['asis-1', 'HIMARK', 'Approved', 'u2', 'approved on the call'],
      ['asis-1', 'Client', 'Approved', 'u2', undefined],
    ],
  )
  assert.ok(state.approvals.every((a) => /^2026-11-05T10:\d\d:00\.000Z$/.test(a.at)), 'time comes from the injected clock')
})

test('client approval before HIMARK approval leaves state unchanged with an error', () => {
  const state = seeded({ status: 'In Review' })
  const error = fails(approveModel(state, 'asis-1', 'Client', ctx()))
  assert.match(error, /HIMARK/)
  assert.equal(state.asIs?.status, 'In Review')
  assert.equal(state.approvals.length, 0)
})

test('a second HIMARK approval is rejected', () => {
  const c = ctx()
  const once = ok(approveModel(seeded({ status: 'In Review' }), 'asis-1', 'HIMARK', c))
  const error = fails(approveModel(once, 'asis-1', 'HIMARK', c))
  assert.match(error, /already approved/i)
  assert.equal(once.approvals.length, 1)
})

test('approving a Draft or an Approved model is rejected', () => {
  fails(approveModel(seeded({ status: 'Draft' }), 'asis-1', 'HIMARK', ctx()))
  fails(approveModel(seeded({ status: 'Approved' }), 'asis-1', 'Client', ctx()))
  fails(approveModel(seeded({ status: 'Approved' }), 'asis-1', 'HIMARK', ctx()))
})

test('approving an unknown model is rejected', () => {
  fails(approveModel(seeded({ status: 'In Review' }), 'nope', 'HIMARK', ctx()))
})

test('submit rejects an empty graph (no start or end event)', async () => {
  const empty = await emptyProcessXml('New process')
  const state = seeded({ xml: empty })
  const problem = await submitBlocker(empty)
  assert.ok(problem, 'an empty diagram has a blocker')
  assert.match(problem, /start event/)
  assert.match(problem, /end event/)
  const error = fails(submitModel(state, 'asis-1', { xml: empty, problem }, ctx()))
  assert.equal(error, problem)
  assert.equal(state.asIs?.status, 'Draft')
})

test('submit reports unreadable XML instead of throwing', async () => {
  const problem = await submitBlocker('<not-bpmn')
  assert.ok(problem && problem.length > 0)
})

test('submit refuses a check made against older XML', async () => {
  const state = seeded()
  const problem = await submitBlocker(EDITED_XML)
  fails(submitModel(state, 'asis-1', { xml: EDITED_XML, problem }, ctx()))
})

test('submit needs assessment:submit and a Draft', async () => {
  fails(await submitted(seeded(), 'asis-1', ctx('Reviewer', 'u3')))
  fails(await submitted(seeded(), 'asis-1', ctx('Viewer', 'u5')))
  ok(await submitted(seeded(), 'asis-1', ctx('Auditor / Consultant', 'u4')))
  fails(await submitted(seeded({ status: 'In Review' }), 'asis-1', ctx()))
})

test('reject without a note is rejected', () => {
  const state = seeded({ status: 'In Review' })
  fails(rejectModel(state, 'asis-1', 'HIMARK', '', ctx()))
  fails(rejectModel(state, 'asis-1', 'HIMARK', '   ', ctx()))
  assert.equal(state.asIs?.status, 'In Review')
})

test('reject returns to Draft and keeps the rejection record', () => {
  const c = ctx()
  const approved = ok(approveModel(seeded({ status: 'In Review' }), 'asis-1', 'HIMARK', c))
  const state = ok(rejectModel(approved, 'asis-1', 'Client', '  Missing the invoice step  ', c))
  assert.equal(state.asIs?.status, 'Draft')
  assert.deepEqual(
    state.approvals.map((a) => [a.party, a.decision, a.note]),
    [
      ['HIMARK', 'Approved', undefined],
      ['Client', 'Rejected', 'Missing the invoice step'],
    ],
  )
})

test('reject must come from the party whose turn it is, and never on a Draft', () => {
  fails(rejectModel(seeded({ status: 'In Review' }), 'asis-1', 'Client', 'no', ctx()))
  fails(rejectModel(seeded({ status: 'Draft' }), 'asis-1', 'HIMARK', 'no', ctx()))
  fails(rejectModel(seeded({ status: 'Approved' }), 'asis-1', 'Client', 'no', ctx()))
})

test('saveDraft updates a Draft and is refused on a locked model with the XML unchanged', () => {
  const c = ctx()
  const saved = ok(saveDraft(seeded(), 'asis-1', EDITED_XML, c))
  assert.equal(saved.asIs?.xml, EDITED_XML)
  assert.equal(saved.asIs?.lastModifiedBy, 'u2')

  for (const status of ['Approved', 'In Review', 'Awaiting Client'] as ProcessModelStatus[]) {
    const locked = seeded({ status })
    fails(saveDraft(locked, 'asis-1', EDITED_XML, c))
    assert.equal(locked.asIs?.xml, VALID_XML)
  }
})

test('saveDraft needs edit rights', () => {
  fails(saveDraft(seeded(), 'asis-1', EDITED_XML, ctx('Viewer', 'u5')))
  fails(saveDraft(seeded(), 'asis-1', EDITED_XML, ctx('Reviewer', 'u3')))
})

test('startToBe twice returns the same To-Be', () => {
  const c = ctx()
  const first = startToBe(seeded({ status: 'Approved' }), 'asis-1', c)
  const state = ok(first)
  assert.ok(state.toBe)
  assert.equal(state.toBe.derivedFromId, 'asis-1')
  const second = startToBe(state, 'asis-1', c)
  const again = ok(second)
  assert.equal(again.toBe?.id, state.toBe.id)
  assert.equal(again, state, 'idempotent: the state is not replaced')
})

test('startToBe on a non-Approved As-Is is rejected', () => {
  for (const status of ['Draft', 'In Review', 'Awaiting Client'] as ProcessModelStatus[]) {
    const state = seeded({ status })
    fails(startToBe(state, 'asis-1', ctx()))
    assert.equal(state.toBe, null)
  }
})

test('permission: Reviewer, Auditor and Viewer cannot approve or request changes; Audit Lead and Admin can', () => {
  for (const role of ['Reviewer', 'Auditor / Consultant', 'Viewer'] as UserRole[]) {
    assert.equal(hasPermission(role, 'processflow:approve'), false)
    const state = seeded({ status: 'In Review' })
    fails(approveModel(state, 'asis-1', 'HIMARK', ctx(role, 'u9')))
    fails(rejectModel(state, 'asis-1', 'HIMARK', 'please fix', ctx(role, 'u9')))
    assert.equal(state.approvals.length, 0)
  }
  assert.equal(hasPermission('Audit Lead', 'processflow:approve'), true)
  ok(approveModel(seeded({ status: 'In Review' }), 'asis-1', 'HIMARK', ctx('Audit Lead')))
  ok(approveModel(seeded({ status: 'In Review' }), 'asis-1', 'HIMARK', ctx('Admin', 'u1')))
})

test('ready message for each combination', () => {
  const empty: WorkspaceState = { flow: null, asIs: null, toBe: null, approvals: [] }
  assert.deepEqual(readiness(empty), { ok: false, message: 'As-Is approval still needed' })
  for (const status of ['Draft', 'In Review', 'Awaiting Client'] as ProcessModelStatus[]) {
    assert.deepEqual(readiness(seeded({ status })), { ok: false, message: 'As-Is approval still needed' })
  }
  assert.deepEqual(readiness(seeded({ status: 'Approved' })), { ok: false, message: 'To-Be approval still needed' })
  for (const status of ['Draft', 'In Review', 'Awaiting Client'] as ProcessModelStatus[]) {
    assert.deepEqual(readiness(seeded({ status: 'Approved' }, { status })), {
      ok: false,
      message: 'To-Be approval still needed',
    })
  }
  assert.deepEqual(readiness(seeded({ status: 'Approved' }, { status: 'Approved' })), {
    ok: true,
    message: 'Ready for report',
  })
})

test('approveBlocker explains the order for the wrong stage', () => {
  assert.equal(approveBlocker('In Review', 'HIMARK'), null)
  assert.equal(approveBlocker('Awaiting Client', 'Client'), null)
  assert.equal(approveBlocker('In Review', 'Client'), 'Waiting for HIMARK approval.')
  assert.equal(approveBlocker('Draft', 'Client'), 'HIMARK approval comes first.')
  assert.equal(approveBlocker('Draft', 'HIMARK'), 'Submit for review first.')
  assert.equal(approveBlocker('Awaiting Client', 'HIMARK'), 'HIMARK has already approved this version.')
  assert.equal(approveBlocker('Approved', 'HIMARK'), 'This version is already approved.')
  assert.equal(approveBlocker('Approved', 'Client'), 'This version is already approved.')
})

test('lockedReason per status', () => {
  assert.equal(lockedReason('Draft'), undefined)
  assert.equal(lockedReason('In Review'), 'Locked — waiting for review.')
  assert.equal(lockedReason('Awaiting Client'), 'Locked — waiting for review.')
  assert.equal(
    lockedReason('Approved'),
    "Locked — this version is approved and can't be edited.",
  )
})

test('stageStates tracks the lifecycle across seven stages', () => {
  const states = (s: WorkspaceState) => stageStates(s).map((stage) => stage.state)
  assert.deepEqual(
    stageStates(seeded()).map((s) => s.label),
    ['Draft', 'In Review', 'Approved', 'Draft', 'In Review', 'Approved', 'Gaps & Recommendations'],
  )
  assert.deepEqual(states(seeded()), ['current', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
  const awaiting = stageStates(seeded({ status: 'Awaiting Client' }))
  assert.deepEqual(awaiting.map((s) => s.state).slice(0, 2), ['done', 'current'])
  assert.equal(awaiting[1].note, 'Awaiting Client')
  assert.equal(stageStates(seeded({ status: 'In Review' }))[1].note, undefined)
  assert.deepEqual(states(seeded({ status: 'Approved' }, { status: 'Draft' })), [
    'done', 'done', 'done', 'current', 'upcoming', 'upcoming', 'upcoming',
  ])
  assert.deepEqual(states(seeded({ status: 'Approved' })), [
    'done', 'done', 'done', 'current', 'upcoming', 'upcoming', 'upcoming',
  ])
  assert.deepEqual(states(seeded({ status: 'Approved' }, { status: 'In Review' })), [
    'done', 'done', 'done', 'done', 'current', 'upcoming', 'upcoming',
  ])
  assert.deepEqual(states(seeded({ status: 'Approved' }, { status: 'Approved' })), [
    'done', 'done', 'done', 'done', 'done', 'done', 'current',
  ])
})

test('startProcessMap creates a Draft As-Is for an audit without one, once', () => {
  const c = ctx()
  const empty: WorkspaceState = { flow: null, asIs: null, toBe: null, approvals: [] }
  const state = ok(startProcessMap(empty, { auditId: 'TRC-OF-2026-0006', name: 'Process map', xml: VALID_XML }, c))
  assert.equal(state.flow?.auditId, 'TRC-OF-2026-0006')
  assert.equal(state.asIs?.status, 'Draft')
  assert.equal(state.asIs?.kind, 'As-Is')
  assert.equal(state.asIs?.processFlowId, state.flow?.id)
  assert.equal(state.toBe, null)
  fails(startProcessMap(state, { auditId: 'TRC-OF-2026-0006', name: 'Again', xml: VALID_XML }, c))
  fails(startProcessMap(empty, { auditId: 'x', name: 'x', xml: VALID_XML }, ctx('Viewer', 'u5')))
})

test('the To-Be follows the same lifecycle once created', async () => {
  const c = ctx()
  let state = ok(startToBe(seeded({ status: 'Approved' }), 'asis-1', c))
  const toBeId = state.toBe!.id
  state = ok(saveDraft(state, toBeId, EDITED_XML, c))
  assert.equal(state.asIs?.xml, VALID_XML, 'editing the To-Be leaves the As-Is alone')
  state = ok(await submitted(state, toBeId, c))
  state = ok(approveModel(state, toBeId, 'HIMARK', c))
  const done = approveModel(state, toBeId, 'Client', c)
  state = ok(done)
  assert.equal(state.toBe?.status, 'Approved')
  assert.ok(done.ok && done.createdToBe === undefined, 'approving a To-Be creates nothing new')
  assert.deepEqual(readiness(state), { ok: true, message: 'Ready for report' })
})

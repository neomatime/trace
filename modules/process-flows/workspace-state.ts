/**
 * Pure transition logic behind the process-flow workspace (`hooks/use-process-flow.ts`).
 * Every function takes the current state and returns either a new state or a
 * readable error; a refused action never mutates or replaces the state.
 * UI-only scope: no repository or persistence (see the plan's Scope Amendment).
 */
import { hasPermission } from '../../lib/auth/permissions.ts'
import { parseBpmnXml } from '../../lib/bpmn/graph.ts'
import type { EntityId, IsoDateTime } from '../../types/common.ts'
import type {
  ApprovalParty,
  ApprovalRecord,
  ProcessFlow,
  ProcessModelStatus,
  ProcessModelVersion,
} from '../../types/process-flow.ts'
import type { UserRole } from '../../types/user.ts'
import { createToBe, isLocked, nextStatus } from './lifecycle.ts'
import type { ProcessAction } from './lifecycle.ts'
import { validateGraph } from './validation.ts'

export interface WorkspaceState {
  flow: ProcessFlow | null
  asIs: ProcessModelVersion | null
  toBe: ProcessModelVersion | null
  approvals: readonly ApprovalRecord[]
}

export interface Context {
  userId: EntityId
  role: UserRole
  /** ISO timestamp for records; injectable so tests are deterministic. */
  now(): IsoDateTime
  newId(prefix: string): EntityId
}

export type Transition =
  | { ok: true; state: WorkspaceState; createdToBe?: ProcessModelVersion }
  | { ok: false; error: string }

export interface Readiness {
  ok: boolean
  message: string
}

export const EMPTY_WORKSPACE: WorkspaceState = { flow: null, asIs: null, toBe: null, approvals: [] }

const refuse = (error: string): Transition => ({ ok: false, error })

const NO_EDIT = "You don't have permission to edit process maps."
const NO_SUBMIT = "You don't have permission to submit for review."
const NO_APPROVE = 'Only the Audit Lead can record approvals.'
const MISSING = 'This process version could not be found.'
const ALREADY_APPROVED = 'This version is already approved.'

function findModel(state: WorkspaceState, id: EntityId): ProcessModelVersion | null {
  if (state.asIs?.id === id) return state.asIs
  if (state.toBe?.id === id) return state.toBe
  return null
}

function replaceModel(state: WorkspaceState, next: ProcessModelVersion): WorkspaceState {
  return next.kind === 'As-Is' ? { ...state, asIs: next } : { ...state, toBe: next }
}

function touched(model: ProcessModelVersion, changes: Partial<ProcessModelVersion>, c: Context): ProcessModelVersion {
  return { ...model, ...changes, lastModifiedBy: c.userId, lastModifiedAt: c.now() }
}

/** Why a model can't be edited, or undefined when it can (Draft). */
export function lockedReason(status: ProcessModelStatus): string | undefined {
  if (isLocked(status)) return "Locked — this version is approved and can't be edited. Create a new version to change it."
  if (status !== 'Draft') return 'Locked — waiting for review.'
  return undefined
}

/** Why `party` can't approve a model in `status` yet, or null when it is their turn. */
export function approveBlocker(status: ProcessModelStatus, party: ApprovalParty): string | null {
  if (status === 'Approved') return ALREADY_APPROVED
  if (party === 'HIMARK') {
    if (status === 'In Review') return null
    if (status === 'Draft') return 'Submit for review first.'
    return 'HIMARK has already approved this version.'
  }
  if (status === 'Awaiting Client') return null
  if (status === 'In Review') return 'Waiting for HIMARK approval.'
  return 'HIMARK approval comes first.'
}

/** The party whose decision a model is waiting for, if any. */
export function partyForStatus(status: ProcessModelStatus): ApprovalParty | null {
  if (status === 'In Review') return 'HIMARK'
  if (status === 'Awaiting Client') return 'Client'
  return null
}

export function startProcessMap(
  state: WorkspaceState,
  args: { auditId: EntityId; name: string; xml: string; assessmentId?: EntityId },
  c: Context,
): Transition {
  if (!hasPermission(c.role, 'audit:run')) return refuse(NO_EDIT)
  if (state.flow || state.asIs) return refuse('This audit already has a process map.')
  const at = c.now()
  const stamp = { createdBy: c.userId, createdAt: at, lastModifiedBy: c.userId, lastModifiedAt: at }
  const flow: ProcessFlow = {
    id: c.newId('flow'),
    auditId: args.auditId,
    assessmentId: args.assessmentId ?? args.auditId,
    name: args.name,
    ...stamp,
  }
  const asIs: ProcessModelVersion = {
    id: c.newId('asis'),
    processFlowId: flow.id,
    kind: 'As-Is',
    version: 1,
    status: 'Draft',
    xml: args.xml,
    ...stamp,
  }
  return { ok: true, state: { flow, asIs, toBe: null, approvals: [] } }
}

export function saveDraft(state: WorkspaceState, modelId: EntityId, xml: string, c: Context): Transition {
  const target = findModel(state, modelId)
  if (!target) return refuse(MISSING)
  const locked = lockedReason(target.status)
  if (locked) return refuse(locked)
  if (!hasPermission(c.role, 'audit:run')) return refuse(NO_EDIT)
  if (target.xml === xml) return { ok: true, state }
  return { ok: true, state: replaceModel(state, touched(target, { xml }, c)) }
}

/**
 * What stops this diagram being submitted, as one readable sentence, or null.
 * Async because parsing BPMN XML is; never throws.
 */
export async function submitBlocker(xml: string): Promise<string | null> {
  const parsed = await parseBpmnXml(xml)
  if (!parsed.ok) return `The diagram can't be read: ${parsed.error}`
  const errors = validateGraph(parsed.graph).filter((issue) => issue.severity === 'error')
  if (errors.length === 0) return null
  return `Fix this before submitting: ${errors.map((issue) => issue.message).join(' ')}`
}

/**
 * Submit with the result of `submitBlocker`, run against `check.xml`. Refused
 * when the model's XML changed after that check, so a stale check never wins.
 */
export function submitModel(
  state: WorkspaceState,
  modelId: EntityId,
  check: { xml: string; problem: string | null },
  c: Context,
): Transition {
  const target = findModel(state, modelId)
  if (!target) return refuse(MISSING)
  if (!hasPermission(c.role, 'assessment:submit')) return refuse(NO_SUBMIT)
  if (target.status !== 'Draft') return refuse('Only a draft can be submitted for review.')
  if (check.xml !== target.xml) return refuse('The diagram changed while it was being checked. Try again.')
  if (check.problem) return refuse(check.problem)
  return { ok: true, state: replaceModel(state, touched(target, { status: nextStatus(target.status, 'submit') }, c)) }
}

function record(
  modelId: EntityId,
  party: ApprovalParty,
  decision: ApprovalRecord['decision'],
  c: Context,
  note: string | undefined,
): ApprovalRecord {
  const trimmed = note?.trim()
  return {
    id: c.newId('approval'),
    modelVersionId: modelId,
    party,
    decision,
    byUserId: c.userId,
    at: c.now(),
    ...(trimmed ? { note: trimmed } : {}),
  }
}

export function approveModel(
  state: WorkspaceState,
  modelId: EntityId,
  party: ApprovalParty,
  c: Context,
  note?: string,
): Transition {
  if (!hasPermission(c.role, 'processflow:approve')) return refuse(NO_APPROVE)
  const target = findModel(state, modelId)
  if (!target) return refuse(MISSING)
  const blocker = approveBlocker(target.status, party)
  if (blocker) return refuse(blocker)
  const action: ProcessAction = party === 'HIMARK' ? 'approve-himark' : 'approve-client'
  const updated = touched(target, { status: nextStatus(target.status, action) }, c)
  let next: WorkspaceState = {
    ...replaceModel(state, updated),
    approvals: [...state.approvals, record(modelId, party, 'Approved', c, note)],
  }
  if (updated.kind === 'As-Is' && isLocked(updated.status) && !next.toBe) {
    const toBe = createToBe(updated, { id: c.newId('tobe'), now: c.now(), userId: c.userId })
    next = { ...next, toBe }
    return { ok: true, state: next, createdToBe: toBe }
  }
  return { ok: true, state: next }
}

/** "Request changes": back to Draft with a required note, recorded like an approval. */
export function rejectModel(
  state: WorkspaceState,
  modelId: EntityId,
  party: ApprovalParty,
  note: string,
  c: Context,
): Transition {
  if (!hasPermission(c.role, 'processflow:approve')) return refuse(NO_APPROVE)
  const target = findModel(state, modelId)
  if (!target) return refuse(MISSING)
  if (note.trim().length === 0) return refuse('Add a comment saying what needs to change.')
  const expected = partyForStatus(target.status)
  if (!expected) {
    return refuse(target.status === 'Draft' ? 'This version is already a draft.' : ALREADY_APPROVED)
  }
  if (expected !== party) {
    return refuse(expected === 'HIMARK' ? 'Waiting for HIMARK review.' : 'Waiting for the client.')
  }
  return {
    ok: true,
    state: {
      ...replaceModel(state, touched(target, { status: nextStatus(target.status, 'reject') }, c)),
      approvals: [...state.approvals, record(modelId, party, 'Rejected', c, note)],
    },
  }
}

/** Create the To-Be from an approved As-Is. Idempotent: an existing To-Be is returned unchanged. */
export function startToBe(state: WorkspaceState, asIsId: EntityId, c: Context): Transition {
  const asIs = state.asIs
  if (!asIs || asIs.id !== asIsId) return refuse(MISSING)
  if (state.toBe && state.toBe.derivedFromId === asIs.id) return { ok: true, state }
  if (state.toBe) return refuse('A To-Be already exists for this process.')
  if (!isLocked(asIs.status)) return refuse('Approve the As-Is before creating the To-Be.')
  if (!hasPermission(c.role, 'audit:run')) return refuse(NO_EDIT)
  const toBe = createToBe(asIs, { id: c.newId('tobe'), now: c.now(), userId: c.userId })
  return { ok: true, state: { ...state, toBe }, createdToBe: toBe }
}

export function readiness(state: WorkspaceState): Readiness {
  if (!state.asIs || !isLocked(state.asIs.status)) return { ok: false, message: 'As-Is approval still needed' }
  if (!state.toBe || !isLocked(state.toBe.status)) return { ok: false, message: 'To-Be approval still needed' }
  return { ok: true, message: 'Ready for report' }
}

export type StageState = 'done' | 'current' | 'upcoming'

export interface Stage {
  group: 'As-Is' | 'To-Be' | 'Outcome'
  label: string
  state: StageState
  /** Extra detail under the label, e.g. "Awaiting Client". */
  note?: string
}

/** 0 Draft, 1 In Review (incl. Awaiting Client), 2 Approved, for one model. */
function statusStep(status: ProcessModelStatus): number {
  if (status === 'Draft') return 0
  if (status === 'Approved') return 2
  return 1
}

/** The seven-stage strip: As-Is Draft / In Review / Approved, To-Be the same, then Gaps & Recommendations. */
export function stageStates(state: WorkspaceState): Stage[] {
  let current: number
  if (!state.asIs || !isLocked(state.asIs.status)) current = state.asIs ? statusStep(state.asIs.status) : 0
  else if (!state.toBe) current = 3
  else if (!isLocked(state.toBe.status)) current = 3 + statusStep(state.toBe.status)
  else current = 6

  const awaiting = (model: ProcessModelVersion | null) =>
    model?.status === 'Awaiting Client' ? 'Awaiting Client' : undefined
  const base: Omit<Stage, 'state'>[] = [
    { group: 'As-Is', label: 'Draft' },
    { group: 'As-Is', label: 'In Review', note: awaiting(state.asIs) },
    { group: 'As-Is', label: 'Approved' },
    { group: 'To-Be', label: 'Draft' },
    { group: 'To-Be', label: 'In Review', note: awaiting(state.toBe) },
    { group: 'To-Be', label: 'Approved' },
    { group: 'Outcome', label: 'Gaps & Recommendations' },
  ]
  return base.map((stage, index) => {
    const result: Stage = {
      group: stage.group,
      label: stage.label,
      state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
    }
    if (stage.note) result.note = stage.note
    return result
  })
}

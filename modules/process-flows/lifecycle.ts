import type { EntityId, IsoDateTime } from '../../types/common.ts'
import type {
  ProcessFlow,
  ProcessModelStatus,
  ProcessModelVersion,
} from '../../types/process-flow.ts'

export type ProcessAction = 'submit' | 'approve-himark' | 'approve-client' | 'reject'

const TRANSITIONS: Record<string, Partial<Record<ProcessAction, ProcessModelStatus>>> = {
  Draft: { submit: 'In Review' },
  'In Review': { 'approve-himark': 'Awaiting Client', reject: 'Draft' },
  'Awaiting Client': { 'approve-client': 'Approved', reject: 'Draft' },
  Approved: {},
}

export function nextStatus(status: ProcessModelStatus, action: ProcessAction): ProcessModelStatus {
  const next = TRANSITIONS[status]?.[action]
  if (!next) throw new Error(`Invalid transition: ${status} + ${action}`)
  return next
}

export function isLocked(status: ProcessModelStatus): boolean {
  return status === 'Approved'
}

export function createToBe(
  asIs: ProcessModelVersion,
  args: { id: EntityId; now: IsoDateTime; userId: EntityId },
): ProcessModelVersion {
  if (asIs.kind !== 'As-Is') throw new Error('A To-Be can only be derived from an As-Is model.')
  if (asIs.status !== 'Approved') throw new Error('A To-Be can only be derived from an Approved As-Is.')
  return {
    id: args.id,
    processFlowId: asIs.processFlowId,
    kind: 'To-Be',
    version: 1,
    status: 'Draft',
    xml: asIs.xml,
    derivedFromId: asIs.id,
    createdBy: args.userId,
    createdAt: args.now,
    lastModifiedBy: args.userId,
    lastModifiedAt: args.now,
  }
}

export function createReassessmentAsIs(
  previousToBe: ProcessModelVersion,
  args: { id: EntityId; processFlowId: EntityId; now: IsoDateTime; userId: EntityId },
): ProcessModelVersion {
  if (previousToBe.kind !== 'To-Be') throw new Error('A reassessment As-Is can only be derived from a To-Be model.')
  if (previousToBe.status !== 'Approved') {
    throw new Error('A reassessment As-Is can only be derived from an Approved To-Be.')
  }
  return {
    id: args.id,
    processFlowId: args.processFlowId,
    kind: 'As-Is',
    version: 1,
    status: 'Draft',
    xml: previousToBe.xml,
    derivedFromId: previousToBe.id,
    createdBy: args.userId,
    createdAt: args.now,
    lastModifiedBy: args.userId,
    lastModifiedAt: args.now,
  }
}

export interface FlowModels {
  flow: ProcessFlow
  asIs?: ProcessModelVersion
  toBe?: ProcessModelVersion
}

export function reportBlockers(flows: readonly FlowModels[]): string[] {
  return flows
    .filter(({ toBe }) => !toBe || toBe.status !== 'Approved')
    .map(({ flow }) => `"${flow.name}" has no approved To-Be.`)
}

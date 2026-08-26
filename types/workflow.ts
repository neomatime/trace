import type { AuditAttribution, EntityId } from './common'

export type WorkflowStepType = 'Manual' | 'Automated' | 'Hybrid'

export interface WorkflowStep extends AuditAttribution {
  id: EntityId
  assessmentId: EntityId
  name: string
  ownerId?: EntityId
  system?: string
  input?: string
  output?: string
  type: WorkflowStepType
  averageDurationMinutes?: number
  waitingTimeMinutes?: number
  approvalRequired: boolean
  control?: string
  painPoint?: string
  evidenceIds: readonly EntityId[]
  nextStepIds: readonly EntityId[]
}

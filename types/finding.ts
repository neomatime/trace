import type { AuditAttribution, EntityId } from './common'

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type FindingConfidence = 'High' | 'Medium' | 'Low'
export type FindingStatus = 'Open' | 'In Progress' | 'Awaiting Verification' | 'Verified' | 'Closed' | 'Accepted' | 'Archived'

export interface Finding extends AuditAttribution {
  id: EntityId
  auditId: EntityId
  assessmentId: EntityId
  title: string
  category: string
  severity: FindingSeverity
  confidence: FindingConfidence
  affectedProcess?: string
  affectedWorkflowStepId?: EntityId
  evidenceIds: readonly EntityId[]
  observedCondition: string
  expectedCondition: string
  rootCause?: string
  businessImpact: string
  createdBy: EntityId
  status?: FindingStatus
  correctiveActionIds?: readonly EntityId[]
  verificationEvidenceIds?: readonly EntityId[]
  verifiedBy?: EntityId
  verifiedAt?: string
}

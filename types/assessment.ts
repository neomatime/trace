import type { AuditAttribution, EntityId, IsoDateTime } from './common'

export type AssessmentKind = 'Baseline' | 'Reassessment'
export type AssessmentStatus = 'Draft' | 'Collecting' | 'Analysing' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Approved' | 'Signed Off' | 'Completed'

export interface Assessment extends AuditAttribution {
  id: EntityId
  auditId: EntityId
  kind: AssessmentKind
  sequence: number
  status: AssessmentStatus
  previousAssessmentId?: EntityId
  performedByIds: readonly EntityId[]
  score?: number
  startedAt?: IsoDateTime
  completedAt?: IsoDateTime
  submittedBy?: EntityId
  submittedAt?: IsoDateTime
  reviewedBy?: EntityId
  reviewedAt?: IsoDateTime
  approvedBy?: EntityId
  approvedAt?: IsoDateTime
  signedOffBy?: EntityId
  signedOffAt?: IsoDateTime
}

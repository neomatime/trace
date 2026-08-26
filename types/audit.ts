import type { AuditTypeName } from './audit-type'
import type { AuditAttribution, EntityId, IsoDateTime } from './common'

export type AuditStatus = 'Draft' | 'In Progress' | 'Under Review' | 'Completed' | 'Archived'

export interface AuditScope {
  objective: string
  startsAt?: string
  endsAt?: string
  included: readonly string[]
  excluded: readonly string[]
  businessUnit?: string
  process?: string
  processOwnerId?: EntityId
  participantIds: readonly EntityId[]
}

/** An Audit is the durable lineage. Baselines and reassessments are separate Assessments. */
export interface Audit extends AuditAttribution {
  id: EntityId
  organisationId: EntityId
  auditType: AuditTypeName
  name: string
  status: AuditStatus
  scope: AuditScope
  assessmentIds: readonly EntityId[]
  ownerId: EntityId
  startedBy?: EntityId
  startedAt?: IsoDateTime
  completedBy?: EntityId
  completedAt?: IsoDateTime
  reviewedBy?: EntityId
  reviewedAt?: IsoDateTime
  approvedBy?: EntityId
  approvedAt?: IsoDateTime
}

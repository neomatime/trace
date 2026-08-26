import type { EntityId, IsoDateTime } from './common'

export interface ActivityEvent {
  id: EntityId
  organisationId: EntityId
  auditId?: EntityId
  assessmentId?: EntityId
  actorId: EntityId | 'system'
  action: string
  subjectType: string
  subjectId: EntityId
  occurredAt: IsoDateTime
  metadata?: Readonly<Record<string, unknown>>
}

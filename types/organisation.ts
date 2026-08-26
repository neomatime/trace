import type { AuditAttribution, EntityId } from './common'

export interface Organisation extends AuditAttribution {
  id: EntityId
  name: string
  initials: string
  active: boolean
}

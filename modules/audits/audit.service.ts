import type { EntityId } from '@/types/common'
import type { AuditRepository } from './audit.repository'

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  getAudit(id: EntityId) {
    return this.repository.findById(id)
  }

  listOrganisationAudits(organisationId: EntityId) {
    return this.repository.listByOrganisation(organisationId)
  }
}

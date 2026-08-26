import type { Audit } from '@/types/audit'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface AuditRepository extends EntityRepository<Audit> {
  listByOrganisation(organisationId: EntityId): Promise<readonly Audit[]>
}

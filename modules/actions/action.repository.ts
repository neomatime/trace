import type { CorrectiveAction } from '@/types/audit-governance'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface CorrectiveActionRepository extends EntityRepository<CorrectiveAction> {
  listByAudit(auditId: EntityId): Promise<readonly CorrectiveAction[]>
  listByFinding(findingId: EntityId): Promise<readonly CorrectiveAction[]>
}

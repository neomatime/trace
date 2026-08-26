import type { Assessment } from '@/types/assessment'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface AssessmentRepository extends EntityRepository<Assessment> {
  listByAudit(auditId: EntityId): Promise<readonly Assessment[]>
}

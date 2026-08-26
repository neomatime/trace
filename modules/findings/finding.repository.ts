import type { Finding } from '@/types/finding'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface FindingRepository extends EntityRepository<Finding> {
  listByAssessment(assessmentId: EntityId): Promise<readonly Finding[]>
}

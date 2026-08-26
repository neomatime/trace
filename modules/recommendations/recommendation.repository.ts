import type { Recommendation } from '@/types/recommendation'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface RecommendationRepository extends EntityRepository<Recommendation> {
  listByFinding(findingId: EntityId): Promise<readonly Recommendation[]>
}

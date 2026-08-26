import type { EntityId } from '@/types/common'
import type { RecommendationRepository } from './recommendation.repository'

export class RecommendationService {
  constructor(private readonly repository: RecommendationRepository) {}

  listFindingRecommendations(findingId: EntityId) {
    return this.repository.listByFinding(findingId)
  }
}

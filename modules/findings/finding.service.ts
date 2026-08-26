import type { EntityId } from '@/types/common'
import type { FindingRepository } from './finding.repository'

export class FindingService {
  constructor(private readonly repository: FindingRepository) {}

  listAssessmentFindings(assessmentId: EntityId) {
    return this.repository.listByAssessment(assessmentId)
  }
}

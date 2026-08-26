import type { EntityId } from '@/types/common'
import type { EvidenceRepository } from './evidence.repository'

export class EvidenceService {
  constructor(private readonly repository: EvidenceRepository) {}

  listAssessmentEvidence(assessmentId: EntityId) {
    return this.repository.listByAssessment(assessmentId)
  }
}

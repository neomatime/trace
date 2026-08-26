import type { EntityId } from '@/types/common'
import type { AssessmentRepository } from './assessment.repository'

export class AssessmentService {
  constructor(private readonly repository: AssessmentRepository) {}

  getAssessment(id: EntityId) {
    return this.repository.findById(id)
  }

  listAuditAssessments(auditId: EntityId) {
    return this.repository.listByAudit(auditId)
  }
}

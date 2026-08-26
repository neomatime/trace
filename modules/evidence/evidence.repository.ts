import type { Evidence } from '@/types/evidence'
import type { EntityId } from '@/types/common'
import type { EntityRepository } from '@/modules/shared/repository'

export interface EvidenceRepository extends EntityRepository<Evidence> {
  listByAssessment(assessmentId: EntityId): Promise<readonly Evidence[]>
}

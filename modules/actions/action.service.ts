import type { CorrectiveAction } from '@/types/audit-governance'
import type { EntityId } from '@/types/common'
import type { CorrectiveActionRepository } from './action.repository'

export class CorrectiveActionService {
  constructor(private readonly repository: CorrectiveActionRepository) {}

  listAuditActions(auditId: EntityId) { return this.repository.listByAudit(auditId) }
  listFindingActions(findingId: EntityId) { return this.repository.listByFinding(findingId) }

  requestVerification(action: CorrectiveAction) {
    if (action.progress < 100) throw new Error('An action must be complete before verification can be requested.')
    return this.repository.save({ ...action, status: 'Awaiting Verification' })
  }

  verify(action: CorrectiveAction, userId: EntityId, verifiedAt: string) {
    if (action.status !== 'Awaiting Verification') throw new Error('Only actions awaiting verification can be verified.')
    return this.repository.save({ ...action, status: 'Verified', verifiedBy: userId, verifiedAt })
  }
}

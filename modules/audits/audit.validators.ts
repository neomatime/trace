import type { Audit } from '@/types/audit'

export function canCompleteAudit(audit: Audit): boolean {
  return audit.status === 'Under Review' && audit.assessmentIds.length > 0
}

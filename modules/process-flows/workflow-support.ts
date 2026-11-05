import { getAuditTypeFromAuditId } from '../../config/audit-types.ts'

/** The process workflow is part of the Operational Flow Audit (capability `workflow-capture`) only. */
export function supportsProcessWorkflow(auditId: string): boolean {
  return (getAuditTypeFromAuditId(auditId).capabilities as readonly string[]).includes('workflow-capture')
}

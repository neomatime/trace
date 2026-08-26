import type { Audit } from '@/types/audit'

export interface AtlasAuditRecord {
  traceAuditId: string
  organisationId: string
  type: string
  name: string
}

export function toAtlasAudit(audit: Audit): AtlasAuditRecord {
  return {
    traceAuditId: audit.id,
    organisationId: audit.organisationId,
    type: audit.auditType,
    name: audit.name,
  }
}

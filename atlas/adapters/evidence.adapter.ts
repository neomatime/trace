import type { Evidence } from '@/types/evidence'

export interface AtlasEvidenceRecord {
  traceEvidenceId: string
  auditId: string
  assessmentId: string
  type: string
  source: string
}

export function toAtlasEvidence(evidence: Evidence): AtlasEvidenceRecord {
  return {
    traceEvidenceId: evidence.id,
    auditId: evidence.auditId,
    assessmentId: evidence.assessmentId ?? '',
    type: evidence.type,
    source: evidence.source,
  }
}

export type { AuditReportConfiguration } from '@/types/audit-governance'

export type ReportJobStatus = 'Not Requested' | 'Queued' | 'Generating' | 'Ready' | 'Failed'

export interface AuditReportJob {
  id: string
  auditId: string
  configurationId: string
  requestedBy: string
  requestedAt: string
  status: ReportJobStatus
  artifactId?: string
}

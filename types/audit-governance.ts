import type { EntityId } from './common'

export type AssessmentReviewStatus = 'Draft' | 'Submitted' | 'In Review' | 'Changes Requested' | 'Approved' | 'Signed Off'

export interface AssessmentReview {
  assessmentId: EntityId
  status: AssessmentReviewStatus
  preparerId: EntityId
  reviewerId?: EntityId
  submittedAt?: string
  reviewedAt?: string
  signedOffAt?: string
  signedOffBy?: EntityId
  openNotes: number
}

export type CorrectiveActionStatus = 'Open' | 'In Progress' | 'Awaiting Verification' | 'Verified' | 'Overdue' | 'Deferred'

export interface CorrectiveAction {
  id: EntityId
  auditId: EntityId
  findingId: EntityId
  recommendationId?: EntityId
  title: string
  owner: string
  dueDate: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: CorrectiveActionStatus
  progress: number
  evidenceCount: number
  verifiedBy?: string
  verifiedAt?: string
}

export type WorkpaperStatus = 'Draft' | 'Prepared' | 'In Review' | 'Reviewed' | 'Locked'

export interface AuditWorkpaper {
  id: EntityId
  auditId: EntityId
  reference: string
  title: string
  section: string
  preparedBy: string
  reviewedBy?: string
  evidenceCount: number
  openNotes: number
  status: WorkpaperStatus
  updatedAt: string
}

export interface RecurringAuditSchedule {
  cadence: 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual' | 'Custom'
  nextDate: string
  endDate?: string
  owner: string
  createAs: 'Draft audit' | 'Draft reassessment'
  active: boolean
}

export interface AuditReportConfiguration {
  id: EntityId
  name: string
  template: 'Executive Summary' | 'Detailed Audit Report' | 'Findings & Actions' | 'Reassessment Comparison'
  sections: string[]
  format: 'PDF' | 'DOCX'
  includeEvidenceIndex: boolean
  includeActivityAppendix: boolean
}

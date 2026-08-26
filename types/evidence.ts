import type { AuditAttribution, EntityId } from './common'

export type EvidenceType =
  | 'Document'
  | 'Policy'
  | 'SOP'
  | 'Screenshot'
  | 'Email'
  | 'System Export'
  | 'Photo'
  | 'Meeting Note'
  | 'Interview Observation'
  | 'URL'
  | 'Data File'
  | 'File'
  | 'Report'
  | 'Data'
  | 'Image'
  | 'Video'
  | 'Observation'
  | 'Other'

export type EvidenceStatus = 'Needs Review' | 'Under Review' | 'Validated' | 'Rejected'
export type EvidencePriority = 'High' | 'Medium' | 'Low'
export type EvidenceSourceType = 'upload-file' | 'url' | 'text-notes' | 'data-source' | 'screenshot' | 'manual-observation'

export interface EvidenceFileMetadata { name:string; extension:string; size:number; mimeType:string; uploadProgress:number; state:'selected'|'uploading'|'ready'|'error' }
export interface EvidenceRelationships { organisationId:string; auditId:string; assessmentId?:string; collectionArea?:string; findingIds:string[]; recommendationIds:string[]; workflowStepIds:string[] }
export interface EvidenceClassification { status:Extract<EvidenceStatus,'Needs Review'|'Under Review'|'Validated'>; priority?:EvidencePriority; tags:string[] }
export interface AddEvidenceState {
  sourceType: EvidenceSourceType | null
  name:string; evidenceType:EvidenceType; description:string; source:string
  file?:EvidenceFileMetadata; url?:string; textContent?:string
  sourceDetails:Record<string,string>
  relationships:EvidenceRelationships
  classification:EvidenceClassification
}

export interface EvidenceWorkflowContext { organisationId?:string; organisationName?:string; auditId?:string; auditName?:string; assessmentId?:string; assessmentName?:string; auditTypeId?:string; findingId?:string; findingName?:string; recommendationId?:string; recommendationName?:string; workflowStepId?:string; workflowStepName?:string }

export interface EvidenceLink {
  targetType: 'question' | 'workflow-step' | 'finding' | 'recommendation'
  targetId: EntityId
}

export interface Evidence extends AuditAttribution {
  id: EntityId
  organisationId: EntityId
  auditId: EntityId
  assessmentId?: EntityId
  name: string
  type: EvidenceType
  status: EvidenceStatus
  source: string
  storageKey?: string
  uploadedBy: EntityId
  links: readonly EvidenceLink[]
  description?: string
  sourceType?: EvidenceSourceType
  priority?: EvidencePriority
  tags?: readonly string[]
  file?: EvidenceFileMetadata
  url?: string
  textContent?: string
}

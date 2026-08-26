export type AuditCapability =
  | 'automated-scan'
  | 'questionnaire'
  | 'workflow-capture'
  | 'operational-data'
  | 'evidence'
  | 'consultant-observations'
  | 'analysis'
  | 'findings'
  | 'recommendations'
  | 'reassessment'

export interface AuditTypeDefinition {
  id: string
  name: string
  description: string
  capabilities: readonly AuditCapability[]
  icon: 'website' | 'brand' | 'digital' | 'workflow' | 'customer-experience' | 'people' | 'intelligence'
  detailFields: readonly AuditFieldDefinition[]
  scopeFields: readonly AuditFieldDefinition[]
  collectionAreas: readonly string[]
  supportedTabs: readonly AuditWorkspaceTab[]
  compatibleFrameworks: readonly string[]
  requiredEvidenceTypes: readonly string[]
  stakeholderLabels: readonly string[]
  scoringEnabled: boolean
}

export type AuditFieldType = 'text' | 'url' | 'textarea' | 'select' | 'date' | 'number' | 'toggle' | 'multi-entry' | 'multi-select'
export interface AuditFieldDefinition { id:string; label:string; type:AuditFieldType; placeholder?:string; required?:boolean; options?:readonly string[] }
export type AuditWorkspaceTab = 'Overview' | 'Collection' | 'Workflow' | 'Findings' | 'Recommendations' | 'Actions' | 'Evidence' | 'Workpapers' | 'Review' | 'Reports' | 'Planning' | 'Technical Details' | 'Reassessment' | 'Activity'

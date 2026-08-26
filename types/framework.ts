import type { AuditTypeName } from './audit-type'
import type { AuditAttribution, EntityId } from './common'

export interface FrameworkCriterion {
  id: EntityId
  categoryId: EntityId
  name: string
  description: string
  weight: number
}

export interface FrameworkCategory {
  id: EntityId
  name: string
  description: string
  weight: number
  criteria: readonly FrameworkCriterion[]
}

export interface Framework extends AuditAttribution {
  id: EntityId
  name: string
  version: string
  auditType: AuditTypeName
  categories: readonly FrameworkCategory[]
  published: boolean
}

export type FrameworkVisibility = 'Private' | 'Organisation' | 'Shared'
export type AssessmentMethod = 'Automated' | 'Manual' | 'Hybrid' | 'Questionnaire' | 'Evidence Review' | 'Data Input'
export type FrameworkResponseType = 'Pass / Fail' | 'Yes / No' | 'Numeric' | 'Percentage' | 'Rating 1–5' | 'Rating 1–10' | 'Multiple Choice' | 'Text' | 'Not Applicable'
export type ScoringModel = 'Weighted Score' | 'Equal Weight' | 'Pass / Fail' | 'Custom'

export interface FrameworkCheck {
  id: EntityId
  sectionId: EntityId
  code: string
  name: string
  description: string
  assessmentMethod: AssessmentMethod
  criteria: string
  responseType: FrameworkResponseType
  weight: number
  required: boolean
  allowNA: boolean
  guidance: string
  evidenceRequirement: string
  severityBehaviour: string
}

export interface FrameworkSection {
  id: EntityId
  code: string
  name: string
  description: string
  weight: number
  guidance: string
  checks: FrameworkCheck[]
}

export interface ScoringRule { id:EntityId; minimum:number; maximum:number; label:string }
export interface SeverityRule { id:EntityId; name:string; scoreImpact:number; priority:string; sla:string; colour:string }
export interface ConditionalRule {
  id: EntityId
  sourceCheckId: EntityId
  operator: 'is' | 'is not' | 'less than' | 'greater than' | 'contains'
  value: string
  action: 'Show check' | 'Hide check' | 'Require evidence' | 'Create finding' | 'Set severity'
  target: string
  enabled: boolean
}
export interface EvidenceRule {
  policy:string
  allowedTypes:string[]
  requireReview:boolean
  requireValidation:boolean
  allowExternalUrls:boolean
  allowAutomatedCollection:boolean
  minimumPerFailedCheck:number
  retentionPolicy:'Organisation default'|'Custom'
  overrides:Record<string,string>
}
export interface FrameworkPermission { editing:'Owner only'|'Selected users'|'Organisation administrators'; approvalRequired:boolean; approver:string; versioning:'Major / Minor'|'Sequential'|'Manual'; requireChangeNotes:boolean; auditTrail:boolean }
export interface FrameworkValidationResult { label:string; valid:boolean; detail?:string }
export interface FrameworkWorkflowState {
  details:{name:string;code:string;auditType:AuditTypeName|'Custom Audit';description:string;owner:string;organisation:string;visibility:FrameworkVisibility;version:string;tags:string[]}
  sections:FrameworkSection[]
  scoring:{model:ScoringModel;minimum:number;maximum:number;bands:ScoringRule[];severities:SeverityRule[];failureRules:Record<string,boolean>;conditionalRules:ConditionalRule[]}
  evidence:EvidenceRule
  governance:FrameworkPermission
}

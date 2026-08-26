import type { AuditTypeName } from './audit-type'
import type { AuditAttribution, EntityId } from './common'

export interface AuditTemplate extends AuditAttribution {
  id: EntityId
  name: string
  description: string
  auditType: AuditTypeName
  frameworkId: EntityId
  active: boolean
}

export type TemplateVisibility='Private'|'Organisation'|'Shared'
export interface TemplateConfiguration {auditNamePattern:string;priority:'High'|'Medium'|'Low';dueDateOffset:number;assessmentType:'Baseline'|'Full Assessment'|'Quick Assessment'|'Custom';autoCreateBaseline:boolean;defaultStatus:'Draft'|'Planned'|'Active';allowOverrides:boolean}
export interface TemplateScopeDefaults {values:Record<string,string|string[]|number|boolean>;allowOverride:boolean}
export interface TemplateTeamDefault {id:string;participationRole:string;defaultUser:string;placeholderRole:string}
export interface TemplateEvidenceDefaults {policy:string;allowedTypes:string[];reviewRequired:boolean;defaultStatus:'Needs Review';defaultPriority:'High'|'Medium'|'Low';allowOverride:boolean}
export interface TemplateGovernance {editing:'Owner only'|'Selected users'|'Organisation administrators';allowDuplicate:boolean;approvalRequired:boolean;approver:string;version:string;versioning:'Major / Minor'|'Sequential'|'Manual';changeNotesRequired:boolean;auditTrail:boolean}
export interface TemplateWorkflowState {
  details:{name:string;code:string;auditType:AuditTypeName|'Custom Audit';description:string;owner:string;organisation:string;visibility:TemplateVisibility;status:'Draft';tags:string[]}
  frameworkId:string
  configuration:TemplateConfiguration
  scope:TemplateScopeDefaults
  team:TemplateTeamDefault[]
  evidence:TemplateEvidenceDefaults
  governance:TemplateGovernance
}

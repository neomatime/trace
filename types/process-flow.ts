import type { AuditAttribution, EntityId, IsoDateTime } from './common'
import type { EffortLevel, RecommendationPriority } from './recommendation'

export type ProcessModelKind = 'As-Is' | 'To-Be'
export type ProcessModelStatus = 'Draft' | 'In Review' | 'Awaiting Client' | 'Approved'
export type ApprovalParty = 'HIMARK' | 'Client'

export interface AuditFields {
  owner?: string
  system?: string
  input?: string
  output?: string
  workMinutes?: number
  waitMinutes?: number
  approvalRequired?: boolean
  control?: string
  painPoint?: string
  evidenceIds: readonly EntityId[]
}

export interface ProcessElement {
  id: EntityId
  bpmnType: string
  name: string
  laneId?: EntityId
  audit: AuditFields
}

export interface ProcessEdge {
  id: EntityId
  sourceId: EntityId
  targetId: EntityId
  kind: 'sequence' | 'message'
  label?: string
}

export interface ProcessGraph {
  elements: readonly ProcessElement[]
  edges: readonly ProcessEdge[]
  /** Lane id -> lane name. Lanes without a name are absent. */
  laneNames?: Readonly<Record<EntityId, string>>
}

export interface ProcessFlow extends AuditAttribution {
  id: EntityId
  auditId: EntityId
  assessmentId: EntityId
  name: string
}

export interface ProcessModelVersion extends AuditAttribution {
  id: EntityId
  processFlowId: EntityId
  kind: ProcessModelKind
  version: number
  status: ProcessModelStatus
  xml: string
  derivedFromId?: EntityId
}

export interface ApprovalRecord {
  id: EntityId
  modelVersionId: EntityId
  party: ApprovalParty
  decision: 'Approved' | 'Rejected'
  byUserId: EntityId
  at: IsoDateTime
  note?: string
}

export type SuggestionSource = 'rule' | 'ai'
export type SuggestionStatus = 'Proposed' | 'Accepted' | 'Edited' | 'Rejected'

export interface ProcessSuggestion {
  id: EntityId
  processFlowId: EntityId
  source: SuggestionSource
  ruleId?: string
  title: string
  rationale: string
  expectedOutcome: string
  elementIds: readonly EntityId[]
  dependsOn: readonly EntityId[]
  priority: RecommendationPriority
  effort: EffortLevel
  status: SuggestionStatus
  decidedBy?: EntityId
  decidedAt?: IsoDateTime
}

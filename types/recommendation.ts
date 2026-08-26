import type { AuditAttribution, EntityId } from './common'

export type RecommendationPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type EffortLevel = 'Low' | 'Medium' | 'High' | 'Very High'

export interface MeasurementTarget {
  metric: string
  unit: string
  baseline?: number
  target?: number
  actual?: number
}

export interface Recommendation extends AuditAttribution {
  id: EntityId
  findingId: EntityId
  title: string
  expectedOutcome: string
  priority: RecommendationPriority
  estimatedEffort: EffortLevel
  dependencies: readonly string[]
  ownerId?: EntityId
  interventionId?: EntityId
  measurement?: MeasurementTarget
  createdBy: EntityId
  approvedBy?: EntityId
}

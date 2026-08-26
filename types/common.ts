export type EntityId = string
export type IsoDateTime = string

export interface AuditAttribution {
  createdBy: EntityId
  createdAt: IsoDateTime
  lastModifiedBy: EntityId
  lastModifiedAt: IsoDateTime
}

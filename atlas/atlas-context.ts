import type { EntityId } from '@/types/common'

export interface AtlasContext {
  organisationId: EntityId
  actorId: EntityId
  correlationId: string
}

import type { EntityId } from '@/types/common'

export interface AtlasRequest<TPayload = unknown> {
  operation: string
  organisationId: EntityId
  payload: TPayload
}

export interface AtlasResponse<TData = unknown> {
  requestId: string
  data: TData
}

export interface AtlasClient {
  execute<TPayload, TData>(request: AtlasRequest<TPayload>): Promise<AtlasResponse<TData>>
}

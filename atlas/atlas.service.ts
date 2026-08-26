import type { AtlasContext } from './atlas-context'
import type { AtlasClient, AtlasResponse } from './atlas.types'

export class AtlasService {
  constructor(private readonly client: AtlasClient) {}

  execute<TPayload, TData>(context: AtlasContext, operation: string, payload: TPayload): Promise<AtlasResponse<TData>> {
    return this.client.execute<TPayload, TData>({
      operation,
      organisationId: context.organisationId,
      payload,
    })
  }
}

import type { Organisation } from '@/types/organisation'

export interface AtlasOrganisationRecord {
  traceOrganisationId: string
  name: string
}

export function toAtlasOrganisation(organisation: Organisation): AtlasOrganisationRecord {
  return { traceOrganisationId: organisation.id, name: organisation.name }
}

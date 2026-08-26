import type { AtlasClient } from './atlas.types'

/** Infrastructure port. A concrete HTTP client belongs here when Atlas is available. */
export type AtlasClientFactory = () => AtlasClient

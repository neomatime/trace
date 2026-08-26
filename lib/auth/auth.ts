import type { EntityId } from '@/types/common'
import type { UserRole } from '@/types/user'

export interface AuthenticatedIdentity {
  userId: EntityId
  organisationId: EntityId
  role: UserRole
}

export interface AuthSession {
  identity: AuthenticatedIdentity
  expiresAt: string
}

export interface AuthProvider {
  getSession(): Promise<AuthSession | null>
}

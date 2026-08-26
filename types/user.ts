import type { EntityId } from './common'

export const USER_ROLES = [
  'Admin',
  'Audit Lead',
  'Auditor / Consultant',
  'Reviewer',
  'Viewer',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface User {
  id: EntityId
  organisationId: EntityId
  name: string
  email: string
  initials: string
  role: UserRole
  active: boolean
}

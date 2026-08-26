import { ROLE_PERMISSIONS, type Permission } from '@/config/roles'
import type { UserRole } from '@/types/user'

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

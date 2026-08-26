'use client'

import { useMemo } from 'react'
import { hasPermission } from '@/lib/auth/permissions'
import type { Permission } from '@/config/roles'
import type { UserRole } from '@/types/user'

export function usePermissions(role: UserRole) {
  return useMemo(() => ({ can: (permission: Permission) => hasPermission(role, permission) }), [role])
}

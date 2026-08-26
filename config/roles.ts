import type { UserRole } from '@/types/user'

export const PERMISSIONS = [
  'organisation:manage',
  'users:manage',
  'audit:create',
  'audit:run',
  'audit:complete',
  'assessment:submit',
  'assessment:review',
  'assessment:approve',
  'assessment:signoff',
  'evidence:create',
  'finding:create',
  'finding:review',
  'recommendation:create',
  'recommendation:approve',
  'action:create',
  'action:update',
  'action:verify',
  'report:configure',
  'audit:read',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  Admin: PERMISSIONS,
  'Audit Lead': ['audit:create', 'audit:run', 'audit:complete', 'assessment:submit', 'assessment:approve', 'assessment:signoff', 'evidence:create', 'finding:create', 'recommendation:create', 'action:create', 'action:update', 'action:verify', 'report:configure', 'audit:read'],
  'Auditor / Consultant': ['audit:run', 'assessment:submit', 'evidence:create', 'finding:create', 'recommendation:create', 'action:create', 'action:update', 'report:configure', 'audit:read'],
  Reviewer: ['assessment:review', 'assessment:approve', 'finding:review', 'recommendation:approve', 'action:verify', 'audit:read'],
  Viewer: ['audit:read'],
}

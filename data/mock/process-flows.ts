/**
 * Mock data for the process-flow workspace (UI-only scope: no repository,
 * no persistence). `hooks/use-process-flow.ts` seeds React state from here,
 * so every change resets on refresh and is not shared between users.
 */
import type { EntityId } from '@/types/common'
import type { ProcessFlow, ProcessModelVersion } from '@/types/process-flow'
import { USER_ROLES, type UserRole } from '@/types/user'
import { auditTeam } from './audit-workflows'
import { PROCESS_FLOW_SEED_XML } from './process-flow-seed'

export interface ProcessFlowUser {
  id: EntityId
  name: string
  role: UserRole
}

/** The audit team from `audit-workflows.ts`, with its short "Auditor" label mapped to the real role. */
export const processFlowUsers: readonly ProcessFlowUser[] = auditTeam.map((member) => ({
  id: member.id,
  name: member.name,
  role: member.role === 'Auditor' ? 'Auditor / Consultant' : member.role,
}))

/**
 * The signed-in user for this screen. The app's shared `currentUser` mock has
 * no id or role, so the workspace acts as the audit team's Audit Lead.
 */
export const currentProcessFlowUser: ProcessFlowUser =
  processFlowUsers.find((user) => user.role === 'Audit Lead') ?? processFlowUsers[0]

export function mockUserForRole(role: UserRole): ProcessFlowUser {
  return processFlowUsers.find((user) => user.role === role) ?? { id: `mock-${role}`, name: role, role }
}

export function userName(id: EntityId): string {
  return processFlowUsers.find((user) => user.id === id)?.name ?? id
}

/**
 * Reads a `?as=<Role>` value. Only the development build calls this (the page
 * checks NODE_ENV): it exists solely so reviewers can exercise the permission
 * gating without a role-switcher in the product. "Auditor" is accepted as
 * shorthand for "Auditor / Consultant".
 */
export function parseMockRole(value: string | undefined): UserRole | null {
  if (!value) return null
  const wanted = value.trim().toLowerCase()
  if (wanted === 'auditor') return 'Auditor / Consultant'
  return USER_ROLES.find((role) => role.toLowerCase() === wanted) ?? null
}

export interface ProcessFlowSeed {
  flow: ProcessFlow
  asIs: ProcessModelVersion
}

const SEEDED_AT = '2026-08-20T09:00:00.000Z'
const stamp = { createdBy: 'u2', createdAt: SEEDED_AT, lastModifiedBy: 'u2', lastModifiedAt: SEEDED_AT }

/** Seed flows by audit id. Only the Purchase-to-Pay reassessment (Operational Flow audit) has one. */
export const processFlowSeeds: Readonly<Record<EntityId, ProcessFlowSeed>> = {
  'TRC-OF-2026-0012': {
    flow: {
      id: 'pf-p2p',
      auditId: 'TRC-OF-2026-0012',
      assessmentId: 'asm-of-2026-0012',
      name: 'Purchase-to-Pay',
      ...stamp,
    },
    asIs: {
      id: 'pf-p2p-asis-1',
      processFlowId: 'pf-p2p',
      kind: 'As-Is',
      version: 1,
      status: 'Draft',
      xml: PROCESS_FLOW_SEED_XML,
      ...stamp,
    },
  },
}

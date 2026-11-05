/**
 * Mock data for the process-flow workspace (UI-only scope: no repository,
 * no persistence). `hooks/use-process-flow.ts` seeds React state from here,
 * so every change resets on refresh and is not shared between users.
 */
import type { EntityId } from '@/types/common'
import type { ProcessFlow, ProcessModelVersion, ProcessSuggestion } from '@/types/process-flow'
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

/**
 * DEMO DATA, NOT AI OUTPUT. These stand in for AI-generated improvement
 * suggestions in the UI-only scope (no Atlas call is made). The Improvements tab
 * always labels them "AI suggestion — needs review (demo data)" and always
 * starts them as Proposed. Element ids refer to the Purchase-to-Pay seed XML.
 */
export const demoAiSuggestions: Readonly<Record<EntityId, readonly ProcessSuggestion[]>> = {
  'TRC-OF-2026-0012': [
    {
      id: 'ai-demo-1',
      processFlowId: 'pf-p2p',
      source: 'ai',
      title: 'Automate the three-way match before the purchase order is created',
      rationale:
        'Requisitions are reviewed by hand and then turned into purchase orders. Matching the requisition, budget and supplier data automatically would catch mismatches earlier.',
      expectedOutcome: 'Fewer returned requisitions and a shorter time from request to purchase order.',
      elementIds: ['UserTask_Review', 'ServiceTask_CreatePO'],
      dependsOn: [],
      priority: 'High',
      effort: 'Medium',
      status: 'Proposed',
    },
    {
      id: 'ai-demo-2',
      processFlowId: 'pf-p2p',
      source: 'ai',
      title: 'Add a requisition checklist so fewer requests are returned',
      rationale:
        'Returned requisitions loop back to the start. A short completeness checklist when the requisition is captured would reduce rework.',
      expectedOutcome: 'Fewer loops back to the capture step, and less rework for requesters and reviewers.',
      elementIds: ['UserTask_Capture', 'ManualTask_Return'],
      dependsOn: [],
      priority: 'Medium',
      effort: 'Low',
      status: 'Proposed',
    },
    {
      id: 'ai-demo-3',
      processFlowId: 'pf-p2p',
      source: 'ai',
      title: 'Send approved requisitions to the ERP without manual hand-off',
      rationale:
        'Once the three-way match is automated, approved requisitions can flow straight into purchase order creation instead of waiting for a person to pick them up.',
      expectedOutcome: 'Purchase orders are issued on the same day the requisition is approved.',
      elementIds: ['ServiceTask_CreatePO'],
      dependsOn: ['ai-demo-1'],
      priority: 'Medium',
      effort: 'High',
      status: 'Proposed',
    },
  ],
}

/**
 * Pure state behind the Improvements tab (UI-only scope: held in React state,
 * never persisted). Suggestions never change status except through
 * `applyDecision`; the decision store is keyed by deterministic suggestion ids
 * so decisions survive recomputation while the To-Be is edited.
 */
import { hasPermission } from '../../lib/auth/permissions.ts'
import type { EntityId, IsoDateTime } from '../../types/common.ts'
import type { ProcessSuggestion } from '../../types/process-flow.ts'
import type { UserRole } from '../../types/user.ts'
import type { SuggestionDraft } from './rules.ts'

export type SuggestionDecision = 'Accepted' | 'Edited' | 'Rejected'

export type SuggestionEdits = Partial<
  Pick<ProcessSuggestion, 'title' | 'rationale' | 'expectedOutcome' | 'priority' | 'effort'>
>

export interface StoredDecision {
  status: SuggestionDecision
  decidedBy: EntityId
  decidedAt: IsoDateTime
  edits?: SuggestionEdits
}

export interface SuggestionStore {
  decisions: Readonly<Record<EntityId, StoredDecision>>
  /** Ids already turned into recommendations. */
  created: readonly EntityId[]
}

export const EMPTY_SUGGESTION_STORE: SuggestionStore = { decisions: {}, created: [] }

/** `rule:<ruleId>:<sorted elementIds joined with ','>` (plus `:<key>` when a key is given). */
export function suggestionId(
  draft: Pick<SuggestionDraft, 'source' | 'ruleId' | 'elementIds'> & { key?: string },
): EntityId {
  const elements = [...draft.elementIds].sort().join(',')
  const base = `${draft.source}:${draft.ruleId ?? ''}:${elements}`
  return draft.key ? `${base}:${draft.key}` : base
}

function withDecision(item: ProcessSuggestion, store: SuggestionStore): ProcessSuggestion {
  const decision = store.decisions[item.id]
  if (!decision) return item
  return {
    ...item,
    ...(decision.edits ?? {}),
    status: decision.status,
    decidedBy: decision.decidedBy,
    decidedAt: decision.decidedAt,
  }
}

export function mergeSuggestions(
  processFlowId: EntityId,
  ruleDrafts: readonly SuggestionDraft[],
  aiDemo: readonly ProcessSuggestion[],
  store: SuggestionStore,
): ProcessSuggestion[] {
  const fromRules: ProcessSuggestion[] = ruleDrafts.map((draft) => ({
    ...draft,
    id: suggestionId(draft),
    processFlowId,
    status: 'Proposed',
  }))
  // AI items always arrive as Proposed from the demo file, whatever it says.
  const fromAi: ProcessSuggestion[] = aiDemo.map((item) => {
    const { decidedBy: _by, decidedAt: _at, ...rest } = item
    void _by
    void _at
    return { ...rest, source: 'ai', status: 'Proposed' }
  })
  const seen = new Set<EntityId>()
  const unique = [...fromRules, ...fromAi].filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  return unique.map((item) => withDecision(item, store))
}

export function applyDecision(
  store: SuggestionStore,
  id: EntityId,
  decision: SuggestionDecision,
  userId: EntityId,
  now: IsoDateTime,
  edits?: SuggestionEdits,
): SuggestionStore {
  if (decision === 'Edited' && (!edits || Object.keys(edits).length === 0)) {
    throw new Error('An edited suggestion needs at least one edit.')
  }
  const stored: StoredDecision = {
    status: decision,
    decidedBy: userId,
    decidedAt: now,
    ...(decision === 'Edited' && edits ? { edits: { ...edits } } : {}),
  }
  return { ...store, decisions: { ...store.decisions, [id]: stored } }
}

export function markRecommendationCreated(store: SuggestionStore, id: EntityId): SuggestionStore {
  if (store.created.includes(id)) return store
  return { ...store, created: [...store.created, id] }
}

export function canDecide(role: UserRole): boolean {
  return hasPermission(role, 'recommendation:create') || hasPermission(role, 'recommendation:approve')
}

export function canCreateRecommendation(role: UserRole): boolean {
  return hasPermission(role, 'recommendation:create')
}

export const DECIDE_REFUSED = 'Only HIMARK staff can decide on suggestions.'
export const CREATE_REFUSED = "You don't have permission to draft recommendations."

/** Action-layer permission check, so a bypassed UI still cannot decide or draft. */
export function guardSuggestionAction(
  role: UserRole,
  kind: 'decide' | 'create',
): { ok: true } | { ok: false; error: string } {
  if (kind === 'decide') return canDecide(role) ? { ok: true } : { ok: false, error: DECIDE_REFUSED }
  return canCreateRecommendation(role) ? { ok: true } : { ok: false, error: CREATE_REFUSED }
}

export function summarise(items: readonly ProcessSuggestion[]): {
  proposed: number
  accepted: number
  edited: number
  rejected: number
} {
  const counts = { proposed: 0, accepted: 0, edited: 0, rejected: 0 }
  for (const item of items) {
    if (item.status === 'Proposed') counts.proposed += 1
    else if (item.status === 'Accepted') counts.accepted += 1
    else if (item.status === 'Edited') counts.edited += 1
    else counts.rejected += 1
  }
  return counts
}

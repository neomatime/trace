'use client'

/**
 * Client-side process-flow state for one audit (UI-only scope: seeded from
 * `data/mock/process-flows.ts`, held in React state, reset on refresh, never
 * shared). All transition rules live in `modules/process-flows/workspace-state.ts`;
 * this hook only applies them. A refused action leaves the state untouched and
 * sets `error`; nothing here throws into React.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { currentProcessFlowUser, demoAiSuggestions, processFlowSeeds } from '@/data/mock/process-flows'
import type { ProcessFlowUser } from '@/data/mock/process-flows'
import {
  EMPTY_WORKSPACE,
  approveModel,
  readiness,
  rejectModel,
  saveDraft as saveDraftState,
  startProcessMap as startProcessMapState,
  startToBe as startToBeState,
  submitBlocker,
  submitModel,
} from '@/modules/process-flows/workspace-state'
import type { Context, Readiness, Transition, WorkspaceState } from '@/modules/process-flows/workspace-state'
import {
  EMPTY_SUGGESTION_STORE,
  applyDecision,
  guardSuggestionAction,
  markRecommendationCreated,
} from '@/modules/process-flows/suggestion-state'
import type { SuggestionDecision, SuggestionEdits, SuggestionStore } from '@/modules/process-flows/suggestion-state'
import type { EntityId } from '@/types/common'
import type {
  ApprovalParty,
  ApprovalRecord,
  ProcessFlow,
  ProcessModelVersion,
  ProcessSuggestion,
} from '@/types/process-flow'

export type ActionResult = { ok: true; createdToBe?: ProcessModelVersion } | { ok: false; error: string }

export interface ProcessFlowActions {
  saveDraft(modelId: EntityId, xml: string): ActionResult
  submit(modelId: EntityId): Promise<ActionResult>
  approve(modelId: EntityId, party: ApprovalParty, note?: string): ActionResult
  reject(modelId: EntityId, party: ApprovalParty, note: string): ActionResult
  startToBe(asIsId: EntityId): ActionResult
  /** Create a Draft As-Is for an audit that has no process map yet. */
  startProcessMap(name: string, xml: string): ActionResult
  clearError(): void
  /** Record a human decision on a suggestion (never called automatically). */
  decideSuggestion(id: EntityId, decision: SuggestionDecision, edits?: SuggestionEdits): ActionResult
  /** Remember that a recommendation was drafted from a suggestion. */
  markRecommendationCreated(id: EntityId): ActionResult
}

export interface UseProcessFlow {
  flow: ProcessFlow | null
  asIs: ProcessModelVersion | null
  toBe: ProcessModelVersion | null
  approvals: readonly ApprovalRecord[]
  /** Always false: the mock data is available synchronously. Kept for the future service. */
  loading: boolean
  /** The last refused action's message, cleared by the next successful one. */
  error: string | null
  ready: Readiness
  /** Demo AI-style suggestions for this audit (mock data, always Proposed). */
  aiDemo: readonly ProcessSuggestion[]
  /** Human decisions on suggestions, keyed by suggestion id. */
  suggestionStore: SuggestionStore
  actions: ProcessFlowActions
}

const NO_SUGGESTIONS: readonly ProcessSuggestion[] = []

function seedFor(auditId: EntityId): WorkspaceState {
  const seed = processFlowSeeds[auditId]
  return seed ? { flow: seed.flow, asIs: seed.asIs, toBe: null, approvals: [] } : EMPTY_WORKSPACE
}

export function useProcessFlow(auditId: EntityId, user: ProcessFlowUser = currentProcessFlowUser): UseProcessFlow {
  const [state, setState] = useState(() => seedFor(auditId))
  const [error, setError] = useState<string | null>(null)
  const [suggestionStore, setSuggestionStore] = useState<SuggestionStore>(EMPTY_SUGGESTION_STORE)
  /** The latest state, so actions fired back-to-back (flush, then submit) see each other's writes. */
  const latest = useRef(state)
  const suggestionLatest = useRef(EMPTY_SUGGESTION_STORE)
  const sequence = useRef(0)

  const context = useCallback(
    (): Context => ({
      userId: user.id,
      role: user.role,
      now: () => new Date().toISOString(),
      newId: (prefix) => `${prefix}-${Date.now().toString(36)}-${(sequence.current += 1)}`,
    }),
    [user.id, user.role],
  )

  const apply = useCallback((result: Transition): ActionResult => {
    if (!result.ok) {
      setError(result.error)
      return result
    }
    if (result.state !== latest.current) {
      latest.current = result.state
      setState(result.state)
    }
    setError(null)
    return result.createdToBe ? { ok: true, createdToBe: result.createdToBe } : { ok: true }
  }, [])

  const actions = useMemo<ProcessFlowActions>(
    () => ({
      saveDraft: (modelId, xml) => apply(saveDraftState(latest.current, modelId, xml, context())),
      submit: async (modelId) => {
        const current = latest.current
        const model = current.asIs?.id === modelId ? current.asIs : current.toBe?.id === modelId ? current.toBe : null
        const xml = model?.xml ?? ''
        const problem = model ? await submitBlocker(xml) : null
        return apply(submitModel(latest.current, modelId, { xml, problem }, context()))
      },
      approve: (modelId, party, note) => apply(approveModel(latest.current, modelId, party, context(), note)),
      reject: (modelId, party, note) => apply(rejectModel(latest.current, modelId, party, note, context())),
      startToBe: (asIsId) => apply(startToBeState(latest.current, asIsId, context())),
      startProcessMap: (name, xml) =>
        apply(startProcessMapState(latest.current, { auditId, name, xml }, context())),
      clearError: () => setError(null),
      decideSuggestion: (id, decision, edits) => {
        const allowed = guardSuggestionAction(user.role, 'decide')
        if (!allowed.ok) return allowed
        try {
          const next = applyDecision(suggestionLatest.current, id, decision, user.id, new Date().toISOString(), edits)
          suggestionLatest.current = next
          setSuggestionStore(next)
          return { ok: true }
        } catch (reason) {
          return { ok: false, error: reason instanceof Error ? reason.message : String(reason) }
        }
      },
      markRecommendationCreated: (id) => {
        const allowed = guardSuggestionAction(user.role, 'create')
        if (!allowed.ok) return allowed
        const next = markRecommendationCreated(suggestionLatest.current, id)
        suggestionLatest.current = next
        setSuggestionStore(next)
        return { ok: true }
      },
    }),
    [apply, auditId, context, user.id, user.role],
  )

  const ready = useMemo(() => readiness(state), [state])

  return {
    flow: state.flow,
    asIs: state.asIs,
    toBe: state.toBe,
    approvals: state.approvals,
    loading: false,
    error,
    ready,
    aiDemo: demoAiSuggestions[auditId] ?? NO_SUGGESTIONS,
    suggestionStore,
    actions,
  }
}

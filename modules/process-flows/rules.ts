import type { EntityId, IsoDateTime } from '../../types/common.ts'
import type { Recommendation } from '../../types/recommendation.ts'
import type { ProcessElement, ProcessGraph, ProcessSuggestion } from '../../types/process-flow.ts'
import { STEP_TYPES, computeMetrics } from './metrics.ts'

export type SuggestionDraft = Omit<
  ProcessSuggestion,
  'id' | 'processFlowId' | 'status' | 'decidedBy' | 'decidedAt'
>

export interface ProcessRule {
  id: string
  title: string
  evaluate(ctx: { asIs: ProcessGraph; toBe: ProcessGraph }): SuggestionDraft[]
}

// Placeholder thresholds: process engineers to confirm.
export const WAIT_THRESHOLD_MINUTES = 4320
export const MAX_HANDOFFS = 5

function predecessorSteps(graph: ProcessGraph, element: ProcessElement): ProcessElement[] {
  const byId = new Map(graph.elements.map((e) => [e.id, e]))
  const found: ProcessElement[] = []
  const visited = new Set<EntityId>([element.id])
  const queue: EntityId[] = [element.id]

  while (queue.length > 0) {
    const current = queue.shift() as EntityId
    for (const edge of graph.edges) {
      if (edge.kind !== 'sequence' || edge.targetId !== current) continue
      const source = byId.get(edge.sourceId)
      if (!source || visited.has(source.id)) continue
      visited.add(source.id)
      if (STEP_TYPES.has(source.bpmnType)) found.push(source)
      else queue.push(source.id)
    }
  }
  return found
}

function nonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== ''
}

const manualRekeying: ProcessRule = {
  id: 'manual-rekeying',
  title: 'Manual re-keying between systems',
  evaluate({ toBe }) {
    const drafts: SuggestionDraft[] = []
    for (const element of toBe.elements) {
      if (element.bpmnType !== 'bpmn:ManualTask' || !nonEmpty(element.audit.system)) continue
      const system = element.audit.system
      const differs = predecessorSteps(toBe, element).some(
        (p) => nonEmpty(p.audit.system) && p.audit.system !== system,
      )
      if (!differs) continue
      drafts.push({
        source: 'rule',
        ruleId: 'manual-rekeying',
        title: `Integrate systems instead of re-keying data in "${element.name}"`,
        rationale: `"${element.name}" is a manual step in ${system} that follows a step in a different system, so the data is likely typed in again by hand.`,
        expectedOutcome: 'Data flows between the systems automatically, with fewer keying errors and less manual effort.',
        elementIds: [element.id],
        dependsOn: [],
        priority: 'High',
        effort: 'Medium',
      })
    }
    return drafts
  },
}

const longWait: ProcessRule = {
  id: 'long-wait',
  title: 'Long wait time',
  evaluate({ toBe }) {
    const drafts: SuggestionDraft[] = []
    for (const element of toBe.elements) {
      const wait = element.audit.waitMinutes
      if (wait === undefined || wait <= WAIT_THRESHOLD_MINUTES) continue
      drafts.push({
        source: 'rule',
        ruleId: 'long-wait',
        title: `Reduce the wait time at "${element.name}"`,
        rationale: `"${element.name}" waits ${wait} minutes, which is longer than the ${WAIT_THRESHOLD_MINUTES} minute threshold.`,
        expectedOutcome: 'Work moves through this step faster and the overall cycle time drops.',
        elementIds: [element.id],
        dependsOn: [],
        priority: 'High',
        effort: 'Low',
      })
    }
    return drafts
  },
}

const duplicateApprovals: ProcessRule = {
  id: 'duplicate-approvals',
  title: 'Duplicate approvals',
  evaluate({ toBe }) {
    const byId = new Map(toBe.elements.map((e) => [e.id, e]))
    const drafts: SuggestionDraft[] = []
    for (const edge of toBe.edges) {
      if (edge.kind !== 'sequence') continue
      const from = byId.get(edge.sourceId)
      const to = byId.get(edge.targetId)
      if (!from || !to) continue
      if (from.audit.approvalRequired !== true || to.audit.approvalRequired !== true) continue
      drafts.push({
        source: 'rule',
        ruleId: 'duplicate-approvals',
        title: `Combine the approvals at "${from.name}" and "${to.name}"`,
        rationale: `"${from.name}" and "${to.name}" both need approval and follow each other directly.`,
        expectedOutcome: 'A single approval replaces two back-to-back approvals, saving time without losing oversight.',
        elementIds: [from.id, to.id],
        dependsOn: [],
        priority: 'Medium',
        effort: 'Low',
      })
    }
    return drafts
  },
}

const missingPaymentControl: ProcessRule = {
  id: 'missing-payment-control',
  title: 'Missing payment control',
  evaluate({ toBe }) {
    const drafts: SuggestionDraft[] = []
    for (const element of toBe.elements) {
      if (!/pay/i.test(element.name) || nonEmpty(element.audit.control)) continue
      drafts.push({
        source: 'rule',
        ruleId: 'missing-payment-control',
        title: `Add a control to "${element.name}"`,
        rationale: `"${element.name}" involves a payment but no control is recorded for it.`,
        expectedOutcome: 'Payments are protected by a documented control that reduces the risk of error or fraud.',
        elementIds: [element.id],
        dependsOn: [],
        priority: 'Critical',
        effort: 'Medium',
      })
    }
    return drafts
  },
}

const excessiveHandoffs: ProcessRule = {
  id: 'excessive-handoffs',
  title: 'Excessive handoffs',
  evaluate({ toBe }) {
    const handoffs = computeMetrics(toBe).handoffs
    if (handoffs <= MAX_HANDOFFS) return []
    return [
      {
        source: 'rule',
        ruleId: 'excessive-handoffs',
        title: 'Reduce the number of handoffs between teams',
        rationale: `The process hands work between lanes ${handoffs} times, more than the ${MAX_HANDOFFS} handoff limit.`,
        expectedOutcome: 'Fewer handoffs mean fewer delays and less risk of work getting lost between teams.',
        elementIds: [],
        dependsOn: [],
        priority: 'Medium',
        effort: 'High',
      },
    ]
  },
}

export const PROCESS_RULES: readonly ProcessRule[] = [
  manualRekeying,
  longWait,
  duplicateApprovals,
  missingPaymentControl,
  excessiveHandoffs,
]

export function runRules(asIs: ProcessGraph, toBe: ProcessGraph): SuggestionDraft[] {
  return PROCESS_RULES.flatMap((rule) => rule.evaluate({ asIs, toBe }))
}

export function decideSuggestion(
  s: ProcessSuggestion,
  decision: 'Accepted' | 'Edited' | 'Rejected',
  userId: EntityId,
  now: IsoDateTime,
): ProcessSuggestion {
  return { ...s, status: decision, decidedBy: userId, decidedAt: now }
}

const PRIORITY_RANK: Record<ProcessSuggestion['priority'], number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const EFFORT_RANK: Record<ProcessSuggestion['effort'], number> = { Low: 0, Medium: 1, High: 2, 'Very High': 3 }

function compareByPriorityThenEffort(a: ProcessSuggestion, b: ProcessSuggestion): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort]
}

export function orderForImplementation(items: readonly ProcessSuggestion[]): ProcessSuggestion[] {
  const ids = new Set(items.map((i) => i.id))
  const remaining = [...items].sort(compareByPriorityThenEffort)
  const placed = new Set<EntityId>()
  const ordered: ProcessSuggestion[] = []

  while (remaining.length > 0) {
    let index = remaining.findIndex((s) =>
      s.dependsOn.every((d) => d === s.id || !ids.has(d) || placed.has(d)),
    )
    // No item is unblocked: a cycle. Break it with the plain priority/effort order.
    if (index === -1) index = 0
    const [next] = remaining.splice(index, 1)
    placed.add(next.id)
    ordered.push(next)
  }
  return ordered
}

export function toRecommendationDraft(
  s: ProcessSuggestion,
): Pick<Recommendation, 'title' | 'expectedOutcome' | 'priority' | 'estimatedEffort' | 'dependencies'> {
  if (s.status !== 'Accepted' && s.status !== 'Edited') {
    throw new Error(`Only accepted or edited suggestions can become recommendations (status: ${s.status}).`)
  }
  return {
    title: s.title,
    expectedOutcome: s.expectedOutcome,
    priority: s.priority,
    estimatedEffort: s.effort,
    dependencies: s.dependsOn,
  }
}

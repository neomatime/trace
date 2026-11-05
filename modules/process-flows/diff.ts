import type { EntityId } from '../../types/common.ts'
import type { ProcessEdge, ProcessElement, ProcessGraph } from '../../types/process-flow.ts'

export type ChangedField =
  | 'bpmnType'
  | 'name'
  | 'laneId'
  | 'owner'
  | 'system'
  | 'input'
  | 'output'
  | 'workMinutes'
  | 'waitMinutes'
  | 'approvalRequired'
  | 'control'
  | 'painPoint'

export interface ElementChange {
  id: EntityId
  before: ProcessElement
  after: ProcessElement
  fields: readonly ChangedField[]
}

export interface GraphDiff {
  removed: readonly ProcessElement[]
  added: readonly ProcessElement[]
  changed: readonly ElementChange[]
  unchanged: readonly ProcessElement[]
  flowsAdded: readonly ProcessEdge[]
  flowsRemoved: readonly ProcessEdge[]
}

// Order of this list defines the order of `ElementChange.fields` (deterministic).
const TOP_LEVEL_FIELDS = ['bpmnType', 'name', 'laneId'] as const
const AUDIT_FIELDS = [
  'owner',
  'system',
  'input',
  'output',
  'workMinutes',
  'waitMinutes',
  'approvalRequired',
  'control',
  'painPoint',
] as const

function changedFields(before: ProcessElement, after: ProcessElement): ChangedField[] {
  const fields: ChangedField[] = []
  for (const f of TOP_LEVEL_FIELDS) {
    if (before[f] !== after[f]) fields.push(f)
  }
  for (const f of AUDIT_FIELDS) {
    if (before.audit[f] !== after.audit[f]) fields.push(f)
  }
  return fields
}

const flowKey = (e: ProcessEdge): string => `${e.sourceId}->${e.targetId}`

// Ordering: every output array keeps the order of the input it is drawn from
// (`removed`, `changed`, `unchanged`, `flowsRemoved` follow As-Is order;
// `added`, `flowsAdded` follow To-Be order).
export function diffGraphs(asIs: ProcessGraph, toBe: ProcessGraph): GraphDiff {
  const toBeById = new Map(toBe.elements.map((e) => [e.id, e]))
  const asIsById = new Map(asIs.elements.map((e) => [e.id, e]))

  const removed: ProcessElement[] = []
  const changed: ElementChange[] = []
  const unchanged: ProcessElement[] = []
  for (const before of asIs.elements) {
    const after = toBeById.get(before.id)
    if (!after) {
      removed.push(before)
      continue
    }
    const fields = changedFields(before, after)
    if (fields.length === 0) unchanged.push(before)
    else changed.push({ id: before.id, before, after, fields })
  }
  const added = toBe.elements.filter((e) => !asIsById.has(e.id))

  const toBeFlows = new Set(toBe.edges.map(flowKey))
  const asIsFlows = new Set(asIs.edges.map(flowKey))
  return {
    removed,
    added,
    changed,
    unchanged,
    flowsAdded: toBe.edges.filter((e) => !asIsFlows.has(flowKey(e))),
    flowsRemoved: asIs.edges.filter((e) => !toBeFlows.has(flowKey(e))),
  }
}

// Pairs a removed element with an added one (a replacement under a new id) and
// reports it as a single change; the change id is the added element's id.
// Returns the same diff object if either id is not in removed/added respectively.
export function relinkReplaced(diff: GraphDiff, removedId: EntityId, addedId: EntityId): GraphDiff {
  const before = diff.removed.find((e) => e.id === removedId)
  const after = diff.added.find((e) => e.id === addedId)
  if (!before || !after) return diff
  return {
    ...diff,
    removed: diff.removed.filter((e) => e !== before),
    added: diff.added.filter((e) => e !== after),
    changed: [...diff.changed, { id: after.id, before, after, fields: changedFields(before, after) }],
  }
}

// An As-Is element with a non-empty painPoint is "uncovered" iff the same id
// exists in the To-Be AND its To-Be painPoint is also non-empty.
// Result keeps As-Is element order.
export function uncoveredPainPoints(asIs: ProcessGraph, toBe: ProcessGraph): readonly ProcessElement[] {
  const toBeById = new Map(toBe.elements.map((e) => [e.id, e]))
  return asIs.elements.filter((e) => {
    if (!e.audit.painPoint) return false
    return Boolean(toBeById.get(e.id)?.audit.painPoint)
  })
}

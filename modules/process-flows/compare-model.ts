import type { EntityId } from '../../types/common.ts'
import type { ProcessElement, ProcessGraph } from '../../types/process-flow.ts'
import type { CompareState } from '../../lib/bpmn/editor/types.ts'
import { diffGraphs, relinkReplaced, uncoveredPainPoints } from './diff.ts'
import type { ChangedField, ElementChange } from './diff.ts'
import { compareMetrics, computeMetrics } from './metrics.ts'
import type { ProcessMetrics } from './metrics.ts'

export type GapKind = 'removed' | 'changed' | 'added' | 'not-addressed'

export interface GapRow {
  /** Unique within one model: `<kind>:<elementId>`. */
  id: EntityId
  kind: GapKind
  title: string
  detail: string
  /** The element to select on the compare canvas. */
  elementId: EntityId
}

export interface CompareModel {
  /** One entry per element id in either graph (a paired removed step is dropped). */
  states: Record<EntityId, CompareState>
  /** Removed, then Changed, then Added, then Not addressed; each in graph order. */
  rows: readonly GapRow[]
  metrics: { asIs: ProcessMetrics; toBe: ProcessMetrics; delta: ProcessMetrics }
  /** As-Is steps that are gone in the To-Be and drawn as ghosts on the compare canvas. */
  removedIds: readonly EntityId[]
  painPoints: { addressed: number; total: number }
}

export interface Replacement {
  removedId: EntityId
  addedId: EntityId
}

const BPMN_TYPE_LABELS: Readonly<Record<string, string>> = {
  'bpmn:Task': 'Task',
  'bpmn:UserTask': 'User task',
  'bpmn:ManualTask': 'Manual task',
  'bpmn:ServiceTask': 'Service task',
  'bpmn:ScriptTask': 'Script task',
  'bpmn:BusinessRuleTask': 'Business rule task',
  'bpmn:SendTask': 'Send task',
  'bpmn:ReceiveTask': 'Receive task',
  'bpmn:SubProcess': 'Sub-process',
  'bpmn:CallActivity': 'Call activity',
  'bpmn:StartEvent': 'Start event',
  'bpmn:EndEvent': 'End event',
  'bpmn:IntermediateCatchEvent': 'Intermediate event',
  'bpmn:IntermediateThrowEvent': 'Intermediate event',
  'bpmn:ExclusiveGateway': 'Decision',
  'bpmn:ParallelGateway': 'Parallel gateway',
  'bpmn:InclusiveGateway': 'Inclusive gateway',
  'bpmn:EventBasedGateway': 'Event-based gateway',
}

function typeLabel(bpmnType: string): string {
  const known = BPMN_TYPE_LABELS[bpmnType]
  if (known) return known
  const words = bpmnType
    .replace(/^bpmn:/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function trimmed(value: number): string {
  return String(Number(value.toFixed(1)))
}

/** `0`, `45 min`, `3 h`, `1 day`, `2 days`. Hours and days keep one decimal at most. */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0'
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${trimmed(minutes / 60)} h`
  const days = Number(trimmed(minutes / 1440))
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/** `7 → 5`; with `unit: 'min'` both values are shown as durations (`1 day → 2 h`). */
export function formatDelta(asIsValue: number, toBeValue: number, unit?: 'min'): string {
  const show = (value: number) => (unit === 'min' ? formatDuration(value) : value.toLocaleString('en-US'))
  return `${show(asIsValue)} → ${show(toBeValue)}`
}

const NONE = 'none'

const text = (value: string | undefined): string => (value ? value : NONE)
const quoted = (value: string | undefined): string => (value ? `"${value}"` : NONE)
const minutes = (value: number | undefined): string => (value === undefined ? NONE : formatDuration(value))
const approval = (value: boolean | undefined): string => (value ? 'required' : 'not required')

export interface LaneNames {
  before?: Readonly<Record<EntityId, string>>
  after?: Readonly<Record<EntityId, string>>
}

const UNNAMED_LANE = 'an unnamed lane'

/** The lane's name, else a tidied id (`Lane_LineManager` -> `Line Manager`), else a generic label. Never the raw id. */
function laneLabel(laneId: EntityId | undefined, names: Readonly<Record<EntityId, string>> | undefined): string {
  if (!laneId) return 'no lane'
  const named = names?.[laneId]
  if (named) return named
  const words = laneId
    .replace(/^lane[_\-\s]*/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
  if (words.length === 0 || (words.length === 1 && /\d/.test(words[0]))) return UNNAMED_LANE
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

function describeField(
  field: ChangedField,
  before: ProcessElement,
  after: ProcessElement,
  lanes: LaneNames,
): string {
  switch (field) {
    case 'bpmnType':
      return `${typeLabel(before.bpmnType)} → ${typeLabel(after.bpmnType)}`
    case 'name':
      return `name ${quoted(before.name)} → ${quoted(after.name)}`
    case 'laneId':
      return `lane ${laneLabel(before.laneId, lanes.before)} → ${laneLabel(after.laneId, lanes.after)}`
    case 'owner':
      return `owner ${text(before.audit.owner)} → ${text(after.audit.owner)}`
    case 'system':
      return `system ${text(before.audit.system)} → ${text(after.audit.system)}`
    case 'input':
      return `input ${text(before.audit.input)} → ${text(after.audit.input)}`
    case 'output':
      return `output ${text(before.audit.output)} → ${text(after.audit.output)}`
    case 'workMinutes':
      return `work ${minutes(before.audit.workMinutes)} → ${minutes(after.audit.workMinutes)}`
    case 'waitMinutes':
      return `wait ${minutes(before.audit.waitMinutes)} → ${minutes(after.audit.waitMinutes)}`
    case 'approvalRequired':
      return `approval ${approval(before.audit.approvalRequired)} → ${approval(after.audit.approvalRequired)}`
    case 'control':
      return `control ${text(before.audit.control)} → ${text(after.audit.control)}`
    case 'painPoint':
      return `pain point ${quoted(before.audit.painPoint)} → ${quoted(after.audit.painPoint)}`
  }
}

/** Plain-English summary of what changed on one step, e.g. `Manual task → Service task · wait 1 day → 0`. */
export function describeChange(change: ElementChange, laneNames: LaneNames = {}): string {
  return change.fields.map((field) => describeField(field, change.before, change.after, laneNames)).join(' · ')
}

/** `3 removed, 2 changed, 1 added, 1 pain point not addressed` (zero counts are left out). */
export function summarizeGaps(rows: readonly GapRow[]): string {
  const count = (kind: GapKind) => rows.filter((row) => row.kind === kind).length
  const parts: string[] = []
  const removed = count('removed')
  const changed = count('changed')
  const added = count('added')
  const open = count('not-addressed')
  if (removed) parts.push(`${removed} removed`)
  if (changed) parts.push(`${changed} changed`)
  if (added) parts.push(`${added} added`)
  if (open) parts.push(`${open} pain point${open === 1 ? '' : 's'} not addressed`)
  return parts.length > 0 ? parts.join(', ') : 'No differences yet'
}

const titleOf = (element: ProcessElement): string => element.name || 'Unnamed step'

export function buildCompareModel(
  asIs: ProcessGraph,
  toBe: ProcessGraph,
  replacements: readonly Replacement[] = [],
): CompareModel {
  let diff = diffGraphs(asIs, toBe)
  for (const pair of replacements) diff = relinkReplaced(diff, pair.removedId, pair.addedId)

  const states: Record<EntityId, CompareState> = {}
  for (const element of diff.unchanged) states[element.id] = 'unchanged'
  for (const change of diff.changed) states[change.id] = 'changed'
  for (const element of diff.added) states[element.id] = 'added'
  for (const element of diff.removed) states[element.id] = 'removed'

  const rows: GapRow[] = []
  for (const element of diff.removed) {
    const pain = element.audit.painPoint
    rows.push({
      id: `removed:${element.id}`,
      kind: 'removed',
      title: titleOf(element),
      detail: pain ? `Removed — fixes pain point "${pain}"` : 'Removed from the process',
      elementId: element.id,
    })
  }
  for (const change of diff.changed) {
    rows.push({
      id: `changed:${change.id}`,
      kind: 'changed',
      title: change.after.name ? change.after.name : titleOf(change.before),
      detail: describeChange(change, { before: asIs.laneNames, after: toBe.laneNames }),
      elementId: change.id,
    })
  }
  for (const element of diff.added) {
    const control = element.audit.control
    rows.push({
      id: `added:${element.id}`,
      kind: 'added',
      title: titleOf(element),
      detail: control ? `New step in the To-Be · new control: ${control}` : 'New step in the To-Be',
      elementId: element.id,
    })
  }

  const toBeById = new Map(toBe.elements.map((element) => [element.id, element]))
  const uncovered = uncoveredPainPoints(asIs, toBe)
  for (const element of uncovered) {
    const current = toBeById.get(element.id) ?? element
    rows.push({
      id: `not-addressed:${element.id}`,
      kind: 'not-addressed',
      title: titleOf(current),
      detail: `Pain point "${current.audit.painPoint ?? element.audit.painPoint ?? ''}" is still in the To-Be`,
      elementId: element.id,
    })
  }

  const asIsMetrics = computeMetrics(asIs)
  const toBeMetrics = computeMetrics(toBe)
  const total = asIs.elements.filter((element) => element.audit.painPoint).length

  return {
    states,
    rows,
    metrics: { asIs: asIsMetrics, toBe: toBeMetrics, delta: compareMetrics(asIsMetrics, toBeMetrics) },
    removedIds: diff.removed.map((element) => element.id),
    painPoints: { addressed: total - uncovered.length, total },
  }
}

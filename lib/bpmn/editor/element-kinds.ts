/**
 * Pure mapping from BPMN types to the visual families the editor knows how to
 * draw. No DOM or diagram-js imports, so it runs under node for unit tests.
 */

export type ShapeKind =
  | 'start-event'
  | 'end-event'
  | 'task'
  | 'exclusive-gateway'
  | 'participant'
  | 'lane'
  | 'unknown'

export type ConnectionKind = 'sequence-flow' | 'message-flow' | 'unknown'

export type TaskIcon = 'user' | 'manual' | 'service' | null

export interface Size {
  width: number
  height: number
}

/** Stage 1 shape types the editor creates and renders with full notation. */
export const STAGE1_SHAPE_TYPES = [
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:Task',
  'bpmn:UserTask',
  'bpmn:ManualTask',
  'bpmn:ServiceTask',
  'bpmn:ExclusiveGateway',
  'bpmn:Participant',
  'bpmn:Lane',
] as const

export const STAGE1_CONNECTION_TYPES = ['bpmn:SequenceFlow', 'bpmn:MessageFlow'] as const

export type Stage1ShapeType = (typeof STAGE1_SHAPE_TYPES)[number]
export type Stage1ConnectionType = (typeof STAGE1_CONNECTION_TYPES)[number]

const SHAPE_KINDS: Readonly<Record<string, ShapeKind>> = {
  'bpmn:StartEvent': 'start-event',
  'bpmn:EndEvent': 'end-event',
  'bpmn:Task': 'task',
  'bpmn:UserTask': 'task',
  'bpmn:ManualTask': 'task',
  'bpmn:ServiceTask': 'task',
  'bpmn:ExclusiveGateway': 'exclusive-gateway',
  'bpmn:Participant': 'participant',
  'bpmn:Lane': 'lane',
}

const TASK_ICONS: Readonly<Record<string, TaskIcon>> = {
  'bpmn:UserTask': 'user',
  'bpmn:ManualTask': 'manual',
  'bpmn:ServiceTask': 'service',
}

const DEFAULT_SIZES: Readonly<Record<ShapeKind, Size>> = {
  'start-event': { width: 36, height: 36 },
  'end-event': { width: 36, height: 36 },
  task: { width: 100, height: 80 },
  'exclusive-gateway': { width: 50, height: 50 },
  participant: { width: 600, height: 250 },
  lane: { width: 570, height: 120 },
  unknown: { width: 100, height: 80 },
}

export function shapeKindOf(bpmnType: string): ShapeKind {
  return SHAPE_KINDS[bpmnType] ?? 'unknown'
}

export function connectionKindOf(bpmnType: string): ConnectionKind {
  if (bpmnType === 'bpmn:SequenceFlow') return 'sequence-flow'
  if (bpmnType === 'bpmn:MessageFlow') return 'message-flow'
  return 'unknown'
}

export function taskIconOf(bpmnType: string): TaskIcon {
  return TASK_ICONS[bpmnType] ?? null
}

export function defaultSizeOf(bpmnType: string): Size {
  return DEFAULT_SIZES[shapeKindOf(bpmnType)]
}

export function isConnectionType(bpmnType: string): boolean {
  return connectionKindOf(bpmnType) !== 'unknown'
}

/** Flow nodes live inside a process (directly, or in a lane of a pool). */
export function isFlowNodeKind(kind: ShapeKind): boolean {
  return (
    kind === 'start-event' ||
    kind === 'end-event' ||
    kind === 'task' ||
    kind === 'exclusive-gateway' ||
    kind === 'unknown'
  )
}

/** Only tasks, pools and unknown boxes are resizable; events and gateways keep BPMN sizes. */
export function isResizableKind(kind: ShapeKind): boolean {
  return kind === 'task' || kind === 'participant' || kind === 'unknown'
}

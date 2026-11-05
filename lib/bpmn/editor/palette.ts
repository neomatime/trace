/**
 * Palette entries as plain data. The React palette and the context pad both
 * read from here, so later delivery stages (more gateways, events,
 * sub-processes...) only append rows. No DOM or diagram-js imports: this runs
 * under node for unit tests.
 */

import type { Stage1ShapeType } from './element-kinds.ts'

/** `basics` is always visible; `more` sits behind the "More elements" toggle. */
export type PaletteGroupId = 'basics' | 'more'

/** Keys into the icon set in `icons.ts`. */
export type PaletteIcon =
  | 'start-event'
  | 'end-event'
  | 'task'
  | 'user-task'
  | 'manual-task'
  | 'service-task'
  | 'exclusive-gateway'
  | 'pool'
  | 'lane'

export interface PaletteEntry {
  /** Stable id, also used for test ids and React keys. */
  id: string
  bpmnType: Stage1ShapeType
  /** Plain-language name shown first. */
  label: string
  /** The BPMN 2.0 name, shown as secondary text. */
  bpmnName: string
  /** One short sentence for tooltips and screen readers. */
  hint: string
  group: PaletteGroupId
  icon: PaletteIcon
}

/**
 * Everything the editor can create from the palette today: the Stage 1 flow
 * nodes, then pools and lanes. A pool added to a diagram without one wraps
 * the existing steps; a lane splits the selected (or only) pool.
 */
export const PALETTE_ENTRIES: readonly PaletteEntry[] = [
  {
    id: 'start',
    bpmnType: 'bpmn:StartEvent',
    label: 'Start',
    bpmnName: 'Start event',
    hint: 'Where the process begins.',
    group: 'basics',
    icon: 'start-event',
  },
  {
    id: 'task',
    bpmnType: 'bpmn:Task',
    label: 'Task',
    bpmnName: 'Task',
    hint: 'A step someone or something performs.',
    group: 'basics',
    icon: 'task',
  },
  {
    id: 'decision',
    bpmnType: 'bpmn:ExclusiveGateway',
    label: 'Decision',
    bpmnName: 'Exclusive gateway',
    hint: 'The flow takes exactly one of several paths.',
    group: 'basics',
    icon: 'exclusive-gateway',
  },
  {
    id: 'end',
    bpmnType: 'bpmn:EndEvent',
    label: 'End',
    bpmnName: 'End event',
    hint: 'Where the process finishes.',
    group: 'basics',
    icon: 'end-event',
  },
  {
    id: 'user-task',
    bpmnType: 'bpmn:UserTask',
    label: 'Person using a system',
    bpmnName: 'User task',
    hint: 'A person completes this step in a system or app.',
    group: 'more',
    icon: 'user-task',
  },
  {
    id: 'manual-task',
    bpmnType: 'bpmn:ManualTask',
    label: 'Manual step',
    bpmnName: 'Manual task',
    hint: 'Done by hand, without a system (for example, signing a form).',
    group: 'more',
    icon: 'manual-task',
  },
  {
    id: 'service-task',
    bpmnType: 'bpmn:ServiceTask',
    label: 'Automated step',
    bpmnName: 'Service task',
    hint: 'A system does this step on its own.',
    group: 'more',
    icon: 'service-task',
  },
  {
    id: 'pool',
    bpmnType: 'bpmn:Participant',
    label: 'Process (pool)',
    bpmnName: 'Pool (participant)',
    hint: 'A frame for one organisation or process; steps go inside it.',
    group: 'more',
    icon: 'pool',
  },
  {
    id: 'lane',
    bpmnType: 'bpmn:Lane',
    label: 'Lane',
    bpmnName: 'Lane',
    hint: 'Splits a pool by who does the work, such as a role or team.',
    group: 'more',
    icon: 'lane',
  },
]

export function paletteGroup(group: PaletteGroupId, entries: readonly PaletteEntry[] = PALETTE_ENTRIES): PaletteEntry[] {
  return entries.filter((entry) => entry.group === group)
}

/**
 * Entries whose plain name or BPMN name contains the query (case-insensitive),
 * in palette order. A blank query returns every entry.
 */
export function filterPalette(query: string, entries: readonly PaletteEntry[] = PALETTE_ENTRIES): PaletteEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...entries]
  return entries.filter(
    (entry) => entry.label.toLowerCase().includes(needle) || entry.bpmnName.toLowerCase().includes(needle),
  )
}

export function paletteEntryFor(bpmnType: string, entries: readonly PaletteEntry[] = PALETTE_ENTRIES): PaletteEntry | undefined {
  return entries.find((entry) => entry.bpmnType === bpmnType)
}

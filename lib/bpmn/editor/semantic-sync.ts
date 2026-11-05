import type { BpmnModdle, ModdleElement } from 'bpmn-moddle'
import type { Bounds, Point } from './diagram-plan.ts'

/**
 * Writes the canvas state back into the BPMN definitions before export.
 *
 * The canvas is the source of truth for what exists and where: this rebuilds
 * process membership, lane membership, sequence/message flow endpoints,
 * incoming/outgoing refs and the DI plane from a plain snapshot of the canvas.
 * Because it reconciles at export time, every canvas command (including undo
 * and redo) is reflected without per-command semantic bookkeeping.
 *
 * Pure (no DOM, no diagram-js) so it is unit-tested under node.
 */

export interface SnapshotShape {
  id: string
  type: string
  businessObject: ModdleElement
  di?: ModdleElement
  /** Canvas parent id; null means the root element. */
  parentId: string | null
  bounds: Bounds
}

export interface SnapshotConnection {
  id: string
  type: string
  businessObject: ModdleElement
  di?: ModdleElement
  parentId: string | null
  sourceId: string
  targetId: string
  waypoints: readonly Point[]
}

export interface DiagramSnapshot {
  shapes: readonly SnapshotShape[]
  connections: readonly SnapshotConnection[]
}

export interface SyncResult {
  warnings: string[]
}

const MANAGED_TYPES = [
  'bpmn:FlowNode',
  'bpmn:SequenceFlow',
  'bpmn:MessageFlow',
  'bpmn:Participant',
  'bpmn:Lane',
]

function isManaged(bo: ModdleElement): boolean {
  return MANAGED_TYPES.some((type) => bo.$instanceOf(type))
}

function round(value: number): number {
  return Math.round(value)
}

export function syncDefinitions(
  moddle: BpmnModdle,
  definitions: ModdleElement,
  snapshot: DiagramSnapshot,
): SyncResult {
  const warnings: string[] = []
  const plane: ModdleElement | undefined = ((definitions.diagrams ?? []) as ModdleElement[])[0]?.plane
  if (!plane) throw new Error('The BPMN definitions have no diagram plane')
  const root: ModdleElement = plane.bpmnElement

  const shapeById = new Map(snapshot.shapes.map((s) => [s.id, s]))
  const onCanvas = new Set<string>([
    ...snapshot.shapes.map((s) => s.id),
    ...snapshot.connections.map((c) => c.id),
  ])
  const previouslyDrawn = new Set<string>(
    ((plane.planeElement ?? []) as ModdleElement[])
      .map((di) => di.bpmnElement?.id as string | undefined)
      .filter((id): id is string => typeof id === 'string'),
  )
  /** Managed element that was drawn before and is no longer on the canvas. */
  const isDeleted = (bo: ModdleElement) =>
    isManaged(bo) && !onCanvas.has(bo.id) && previouslyDrawn.has(bo.id)
  /** Kept as-is: unmanaged types, and elements never drawn (no DI). */
  const isUntouched = (bo: ModdleElement) => !onCanvas.has(bo.id) && !isDeleted(bo)

  // 0. Processes follow their pools: a new pool brings its process in, a
  //    deleted pool takes its process (and everything in it) out.
  const keptPoolProcesses = new Set<ModdleElement>()
  for (const shape of snapshot.shapes) {
    if (shape.type === 'bpmn:Participant' && shape.businessObject.processRef) {
      keptPoolProcesses.add(shape.businessObject.processRef)
    }
  }
  const removedProcesses = new Set<ModdleElement>()
  if (root.$type === 'bpmn:Collaboration') {
    for (const participant of (root.participants ?? []) as ModdleElement[]) {
      if (!isDeleted(participant) || !participant.processRef) continue
      if (!keptPoolProcesses.has(participant.processRef)) removedProcesses.add(participant.processRef)
    }
  }
  const rootElements = ((definitions.rootElements ?? []) as ModdleElement[]).filter((e) => !removedProcesses.has(e))
  for (const process of keptPoolProcesses) {
    if (rootElements.includes(process)) continue
    process.$parent = definitions
    rootElements.push(process)
  }
  definitions.rootElements = rootElements
  /** Ids of everything that went away with a removed process. */
  const removedIds = new Set<string>()
  const collectIds = (container: ModdleElement) => {
    for (const element of (container.flowElements ?? []) as ModdleElement[]) {
      removedIds.add(element.id)
      if (element.flowElements) collectIds(element)
    }
  }
  for (const process of removedProcesses) {
    removedIds.add(process.id)
    collectIds(process)
  }
  /** A message flow end that no longer exists anywhere. */
  const isGone = (bo: ModdleElement | undefined) => !bo || removedIds.has(bo.id) || isDeleted(bo)

  const processes = rootElements.filter((e) => e.$type === 'bpmn:Process')

  const ancestry = (id: string) => {
    const lanes: ModdleElement[] = []
    let cursor = shapeById.get(id)?.parentId ?? null
    while (cursor) {
      const shape = shapeById.get(cursor)
      if (!shape) break
      if (shape.type === 'bpmn:Lane') lanes.push(shape.businessObject)
      if (shape.type === 'bpmn:Participant') return { lanes, participant: shape.businessObject }
      cursor = shape.parentId
    }
    return { lanes, participant: undefined as ModdleElement | undefined }
  }

  const processOf = (nodeId: string): ModdleElement | undefined => {
    const { participant } = ancestry(nodeId)
    if (participant) return participant.processRef
    return root.$type === 'bpmn:Process' ? root : undefined
  }

  // 1. Flow elements per process
  const assigned = new Map<ModdleElement, ModdleElement[]>(
    processes.map((p) => [p, ((p.flowElements ?? []) as ModdleElement[]).filter(isUntouched)]),
  )
  const nodes = snapshot.shapes.filter((s) => s.businessObject.$instanceOf('bpmn:FlowNode'))
  for (const node of nodes) {
    const process = processOf(node.id)
    const bucket = process ? assigned.get(process) : undefined
    if (!bucket) {
      warnings.push(`"${node.id}" is not inside a pool with a process and was not saved`)
      continue
    }
    bucket.push(node.businessObject)
  }
  for (const flow of snapshot.connections) {
    const bo = flow.businessObject
    const source = shapeById.get(flow.sourceId)?.businessObject
    const target = shapeById.get(flow.targetId)?.businessObject
    if (!source || !target) {
      warnings.push(`"${flow.id}" has a missing end and was not saved`)
      continue
    }
    bo.sourceRef = source
    bo.targetRef = target
    if (flow.type !== 'bpmn:SequenceFlow') continue
    const bucket = assigned.get(processOf(flow.sourceId) as ModdleElement)
    if (bucket) bucket.push(bo)
    else warnings.push(`"${flow.id}" is not inside a process and was not saved`)
  }
  for (const [process, elements] of assigned) process.flowElements = elements

  // 2. incoming / outgoing refs from every sequence flow that is kept
  for (const process of processes) {
    const elements = (process.flowElements ?? []) as ModdleElement[]
    for (const e of elements) {
      if (e.$instanceOf('bpmn:FlowNode')) {
        e.incoming = []
        e.outgoing = []
      }
    }
    for (const e of elements) {
      if (!e.$instanceOf('bpmn:SequenceFlow')) continue
      e.sourceRef?.outgoing?.push(e)
      e.targetRef?.incoming?.push(e)
    }
  }

  // 3. Lanes: drop deleted ones, attach new ones, rebuild flowNodeRef
  const placedLanes = new Set<ModdleElement>()
  const pruneLanes = (laneSet: ModdleElement) => {
    laneSet.lanes = ((laneSet.lanes ?? []) as ModdleElement[]).filter((lane) => !isDeleted(lane))
    for (const lane of laneSet.lanes as ModdleElement[]) {
      placedLanes.add(lane)
      if (lane.childLaneSet) pruneLanes(lane.childLaneSet)
    }
  }
  for (const process of processes) {
    for (const set of (process.laneSets ?? []) as ModdleElement[]) pruneLanes(set)
  }
  const laneShapes = snapshot.shapes.filter((s) => s.type === 'bpmn:Lane')
  for (const laneShape of laneShapes) {
    const lane = laneShape.businessObject
    lane.flowNodeRef = []
    if (placedLanes.has(lane)) continue
    const parent = laneShape.parentId ? shapeById.get(laneShape.parentId) : undefined
    let laneSet: ModdleElement | undefined
    if (parent?.type === 'bpmn:Lane') {
      parent.businessObject.childLaneSet ??= moddle.create('bpmn:LaneSet', { lanes: [] })
      laneSet = parent.businessObject.childLaneSet
    } else {
      const process = parent ? parent.businessObject.processRef : root.$type === 'bpmn:Process' ? root : undefined
      if (process) {
        process.laneSets ??= []
        if (process.laneSets.length === 0) process.laneSets.push(moddle.create('bpmn:LaneSet', { lanes: [] }))
        laneSet = process.laneSets[0]
      }
    }
    if (!laneSet) {
      warnings.push(`Lane "${lane.id}" is not inside a pool and was not saved`)
      continue
    }
    laneSet.lanes ??= []
    laneSet.lanes.push(lane)
    placedLanes.add(lane)
  }
  for (const node of nodes) {
    for (const lane of ancestry(node.id).lanes) lane.flowNodeRef.push(node.businessObject)
  }

  // 4. Collaboration: participants and message flows
  if (root.$type === 'bpmn:Collaboration') {
    const kept = ((root.participants ?? []) as ModdleElement[]).filter((p) => !isDeleted(p))
    for (const shape of snapshot.shapes) {
      if (shape.type === 'bpmn:Participant' && !kept.includes(shape.businessObject)) {
        kept.push(shape.businessObject)
      }
    }
    root.participants = kept
    root.messageFlows = [
      ...((root.messageFlows ?? []) as ModdleElement[]).filter(
        (flow) => isUntouched(flow) && !isGone(flow.sourceRef) && !isGone(flow.targetRef),
      ),
      ...snapshot.connections
        .filter((c) => c.type === 'bpmn:MessageFlow' && c.businessObject.sourceRef)
        .map((c) => c.businessObject),
    ]
  }

  // 5. DI plane: keep unmanaged DI, then shapes (outer first), then edges
  const depth = (shape: SnapshotShape) => {
    let d = 0
    let cursor = shape.parentId
    while (cursor) {
      d += 1
      cursor = shapeById.get(cursor)?.parentId ?? null
    }
    return d
  }
  const orderedShapes = snapshot.shapes
    .map((shape, index) => ({ shape, index, depth: depth(shape) }))
    .sort((a, b) => a.depth - b.depth || a.index - b.index)
    .map((entry) => entry.shape)

  const planeElements: ModdleElement[] = ((plane.planeElement ?? []) as ModdleElement[]).filter(
    (di) => !di.bpmnElement || !isManaged(di.bpmnElement),
  )
  for (const shape of orderedShapes) {
    const di =
      shape.di ??
      moddle.create('bpmndi:BPMNShape', { id: `${shape.id}_di`, bpmnElement: shape.businessObject })
    di.bpmnElement = shape.businessObject
    if ((shape.type === 'bpmn:Participant' || shape.type === 'bpmn:Lane') && di.isHorizontal === undefined) {
      di.isHorizontal = true
    }
    di.bounds = moddle.create('dc:Bounds', {
      x: round(shape.bounds.x),
      y: round(shape.bounds.y),
      width: round(shape.bounds.width),
      height: round(shape.bounds.height),
    })
    planeElements.push(di)
  }
  for (const connection of snapshot.connections) {
    const di =
      connection.di ??
      moddle.create('bpmndi:BPMNEdge', { id: `${connection.id}_di`, bpmnElement: connection.businessObject })
    di.bpmnElement = connection.businessObject
    di.waypoint = connection.waypoints.map((p) => moddle.create('dc:Point', { x: round(p.x), y: round(p.y) }))
    planeElements.push(di)
  }
  plane.planeElement = planeElements

  return { warnings }
}

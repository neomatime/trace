import type { ModdleElement } from 'bpmn-moddle'

/**
 * Turns parsed BPMN definitions (semantic model + DI) into a flat, ordered list
 * of shapes and connections for the canvas. Pure: no DOM, no diagram-js, so the
 * same plan drives both the browser importer and node round-trip tests.
 *
 * Canvas tree rules (TRACE's own, not BPMN's): a pool's lanes are children of
 * the pool (nested lanes of their lane); a flow node is a child of the deepest
 * lane that lists it in `flowNodeRef`, else of its pool, else of the root.
 * Sequence flows belong to their pool (or the root process); message flows to
 * the root.
 */

export interface Point {
  x: number
  y: number
}

export interface Bounds extends Point {
  width: number
  height: number
}

export interface PlannedShape {
  id: string
  type: string
  businessObject: ModdleElement
  di: ModdleElement
  /** Canvas parent id; null means the root element. */
  parentId: string | null
  bounds: Bounds
  /** Pools without a process are drawn collapsed. */
  collapsed: boolean
}

export interface PlannedConnection {
  id: string
  type: string
  businessObject: ModdleElement
  di: ModdleElement
  parentId: string | null
  sourceId: string
  targetId: string
  waypoints: Point[]
}

export interface DiagramPlan {
  root: { id: string; type: string; businessObject: ModdleElement }
  /** Parents always precede their children. */
  shapes: PlannedShape[]
  connections: PlannedConnection[]
  warnings: string[]
}

function boundsOf(di: ModdleElement): Bounds {
  const b = di.bounds ?? {}
  return {
    x: Number(b.x ?? 0),
    y: Number(b.y ?? 0),
    width: Number(b.width ?? 0),
    height: Number(b.height ?? 0),
  }
}

function waypointsOf(di: ModdleElement): Point[] {
  return ((di.waypoint ?? []) as ModdleElement[]).map((p) => ({ x: Number(p.x), y: Number(p.y) }))
}

export function planDiagram(definitions: ModdleElement): DiagramPlan {
  const diagram = ((definitions.diagrams ?? []) as ModdleElement[])[0]
  const plane = diagram?.plane
  const rootBo: ModdleElement | undefined = plane?.bpmnElement
  if (!plane || !rootBo) {
    throw new Error('The BPMN XML has no diagram to display')
  }

  const diById = new Map<string, ModdleElement>()
  for (const di of (plane.planeElement ?? []) as ModdleElement[]) {
    const id = di.bpmnElement?.id
    if (id) diById.set(id, di)
  }

  const plan: DiagramPlan = {
    root: { id: rootBo.id, type: rootBo.$type, businessObject: rootBo },
    shapes: [],
    connections: [],
    warnings: [],
  }
  const planned = new Set<string>()

  const addShape = (bo: ModdleElement, parentId: string | null, collapsed = false) => {
    const di = diById.get(bo.id)
    if (!di) {
      plan.warnings.push(`"${bo.id}" has no diagram position and is not shown`)
      return false
    }
    plan.shapes.push({
      id: bo.id,
      type: bo.$type,
      businessObject: bo,
      di,
      parentId,
      bounds: boundsOf(di),
      collapsed,
    })
    planned.add(bo.id)
    return true
  }

  const addConnection = (bo: ModdleElement, parentId: string | null) => {
    const di = diById.get(bo.id)
    const sourceId = bo.sourceRef?.id
    const targetId = bo.targetRef?.id
    if (!di || !sourceId || !targetId || !planned.has(sourceId) || !planned.has(targetId)) {
      plan.warnings.push(`"${bo.id}" cannot be drawn and is not shown`)
      return
    }
    plan.connections.push({
      id: bo.id,
      type: bo.$type,
      businessObject: bo,
      di,
      parentId,
      sourceId,
      targetId,
      waypoints: waypointsOf(di),
    })
  }

  const addProcessContents = (process: ModdleElement, containerId: string | null) => {
    const laneOfNode = new Map<string, string>()
    const addLanes = (lanes: ModdleElement[], parentId: string | null) => {
      for (const lane of lanes) {
        const shown = addShape(lane, parentId)
        const ownId = shown ? lane.id : parentId
        const children = (lane.childLaneSet?.lanes ?? []) as ModdleElement[]
        // deepest shown lane wins: record parent first, child lanes overwrite
        if (shown) {
          for (const ref of (lane.flowNodeRef ?? []) as ModdleElement[]) laneOfNode.set(ref.id, lane.id)
        }
        addLanes(children, ownId)
      }
    }
    for (const set of (process.laneSets ?? []) as ModdleElement[]) {
      addLanes((set.lanes ?? []) as ModdleElement[], containerId)
    }

    const flowElements = (process.flowElements ?? []) as ModdleElement[]
    for (const element of flowElements) {
      if (element.$instanceOf('bpmn:FlowNode')) {
        addShape(element, laneOfNode.get(element.id) ?? containerId)
      }
    }
    for (const element of flowElements) {
      if (element.$instanceOf('bpmn:SequenceFlow')) addConnection(element, containerId)
    }
  }

  if (rootBo.$type === 'bpmn:Collaboration') {
    for (const participant of (rootBo.participants ?? []) as ModdleElement[]) {
      const process: ModdleElement | undefined = participant.processRef
      if (!addShape(participant, null, !process)) continue
      if (process) addProcessContents(process, participant.id)
    }
    for (const flow of (rootBo.messageFlows ?? []) as ModdleElement[]) addConnection(flow, null)
  } else if (rootBo.$type === 'bpmn:Process') {
    addProcessContents(rootBo, null)
  } else {
    throw new Error(`Diagrams of "${rootBo.$type}" are not supported`)
  }

  return plan
}

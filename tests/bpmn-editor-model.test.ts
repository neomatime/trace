import test from 'node:test'
import assert from 'node:assert/strict'
import { createModdle } from '../lib/bpmn/trace-moddle.ts'
import { parseBpmnXml } from '../lib/bpmn/graph.ts'
import {
  connectionKindOf,
  defaultSizeOf,
  isFlowNodeKind,
  isResizableKind,
  shapeKindOf,
  STAGE1_CONNECTION_TYPES,
  STAGE1_SHAPE_TYPES,
  taskIconOf,
} from '../lib/bpmn/editor/element-kinds.ts'
import { planDiagram } from '../lib/bpmn/editor/diagram-plan.ts'
import type { DiagramPlan } from '../lib/bpmn/editor/diagram-plan.ts'
import { syncDefinitions } from '../lib/bpmn/editor/semantic-sync.ts'
import type { DiagramSnapshot, SnapshotShape } from '../lib/bpmn/editor/semantic-sync.ts'
import { SCRATCH_SEED_XML } from '../lib/bpmn/editor/__scratch-seed.ts'

async function load(xml: string) {
  const moddle = createModdle()
  const { rootElement } = await moddle.fromXML(xml)
  return { moddle, definitions: rootElement }
}

/** What the browser editor hands to syncDefinitions when nothing was edited. */
function snapshotOf(plan: DiagramPlan): { shapes: SnapshotShape[]; connections: DiagramSnapshot['connections'] } {
  return {
    shapes: plan.shapes.map((s) => ({
      id: s.id,
      type: s.type,
      businessObject: s.businessObject,
      di: s.di,
      parentId: s.parentId,
      bounds: { ...s.bounds },
    })),
    connections: plan.connections.map((c) => ({
      id: c.id,
      type: c.type,
      businessObject: c.businessObject,
      di: c.di,
      parentId: c.parentId,
      sourceId: c.sourceId,
      targetId: c.targetId,
      waypoints: c.waypoints.map((p) => ({ ...p })),
    })),
  }
}

async function graphOf(xml: string) {
  const result = await parseBpmnXml(xml)
  assert.ok(result.ok, result.ok ? '' : result.error)
  return result.graph
}

test('element kinds map every Stage 1 type to its notation family', () => {
  assert.equal(shapeKindOf('bpmn:StartEvent'), 'start-event')
  assert.equal(shapeKindOf('bpmn:EndEvent'), 'end-event')
  for (const t of ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ManualTask', 'bpmn:ServiceTask']) {
    assert.equal(shapeKindOf(t), 'task')
  }
  assert.equal(shapeKindOf('bpmn:ExclusiveGateway'), 'exclusive-gateway')
  assert.equal(shapeKindOf('bpmn:Participant'), 'participant')
  assert.equal(shapeKindOf('bpmn:Lane'), 'lane')
  assert.equal(shapeKindOf('bpmn:ParallelGateway'), 'unknown')
  assert.equal(connectionKindOf('bpmn:SequenceFlow'), 'sequence-flow')
  assert.equal(connectionKindOf('bpmn:MessageFlow'), 'message-flow')
  assert.equal(connectionKindOf('bpmn:Association'), 'unknown')
  for (const t of STAGE1_SHAPE_TYPES) assert.notEqual(shapeKindOf(t), 'unknown')
  for (const t of STAGE1_CONNECTION_TYPES) assert.notEqual(connectionKindOf(t), 'unknown')
})

test('task icons are distinct for user, manual and service tasks only', () => {
  assert.equal(taskIconOf('bpmn:UserTask'), 'user')
  assert.equal(taskIconOf('bpmn:ManualTask'), 'manual')
  assert.equal(taskIconOf('bpmn:ServiceTask'), 'service')
  assert.equal(taskIconOf('bpmn:Task'), null)
  assert.equal(taskIconOf('bpmn:StartEvent'), null)
})

test('default sizes and capabilities follow BPMN conventions', () => {
  assert.deepEqual(defaultSizeOf('bpmn:StartEvent'), { width: 36, height: 36 })
  assert.deepEqual(defaultSizeOf('bpmn:UserTask'), { width: 100, height: 80 })
  assert.deepEqual(defaultSizeOf('bpmn:ExclusiveGateway'), { width: 50, height: 50 })
  assert.ok(isFlowNodeKind('task'))
  assert.ok(!isFlowNodeKind('lane'))
  assert.ok(isResizableKind('task'))
  assert.ok(!isResizableKind('start-event'))
  assert.ok(!isResizableKind('exclusive-gateway'))
  assert.ok(isResizableKind('participant'))
  assert.ok(isResizableKind('lane'), 'lanes resize since Task 12')
})

test('planDiagram nests lanes in the pool and flow nodes in their lane', async () => {
  const { definitions } = await load(SCRATCH_SEED_XML)
  const plan = planDiagram(definitions)
  assert.equal(plan.root.type, 'bpmn:Collaboration')
  assert.deepEqual(plan.warnings, [])
  const parentOf = Object.fromEntries(plan.shapes.map((s) => [s.id, s.parentId]))
  assert.equal(parentOf.Participant_Requisition, null)
  assert.equal(parentOf.Participant_Supplier, null)
  assert.equal(parentOf.Lane_Finance, 'Participant_Requisition')
  assert.equal(parentOf.UserTask_Capture, 'Lane_Requester')
  assert.equal(parentOf.Gateway_Approved, 'Lane_LineManager')
  assert.equal(parentOf.EndEvent_Issued, 'Lane_Finance')
  const supplier = plan.shapes.find((s) => s.id === 'Participant_Supplier')
  assert.equal(supplier?.collapsed, true)
  // parents precede children
  const index = new Map(plan.shapes.map((s, i) => [s.id, i]))
  for (const s of plan.shapes) {
    if (s.parentId) assert.ok((index.get(s.parentId) ?? Infinity) < (index.get(s.id) ?? -1))
  }
  assert.equal(plan.connections.length, 8)
  const message = plan.connections.find((c) => c.id === 'MessageFlow_PO')
  assert.equal(message?.parentId, null)
  assert.equal(message?.targetId, 'Participant_Supplier')
})

test('an unedited canvas exports XML that re-parses to the identical graph', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const before = await graphOf(SCRATCH_SEED_XML)
  const result = syncDefinitions(moddle, definitions, snapshotOf(planDiagram(definitions)))
  assert.deepEqual(result.warnings, [])
  const { xml } = await moddle.toXML(definitions, { format: true })
  assert.deepEqual(await graphOf(xml), before)

  // and a second import/export cycle is stable
  const again = await load(xml)
  syncDefinitions(again.moddle, again.definitions, snapshotOf(planDiagram(again.definitions)))
  const { xml: xml2 } = await again.moddle.toXML(again.definitions, { format: true })
  assert.equal(xml2, xml)
})

test('moving a shape on the canvas updates DI bounds and lane membership', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const review = snapshot.shapes.find((s) => s.id === 'UserTask_Review') as SnapshotShape
  review.parentId = 'Lane_Finance'
  review.bounds = { x: 600, y: 395, width: 100, height: 80 }
  syncDefinitions(moddle, definitions, snapshot)
  const { xml } = await moddle.toXML(definitions, { format: true })
  const graph = await graphOf(xml)
  assert.equal(graph.elements.find((e) => e.id === 'UserTask_Review')?.laneId, 'Lane_Finance')
  assert.match(xml, /bpmnElement="UserTask_Review">\s*<dc:Bounds x="600" y="395" width="100" height="80"/)
  // audit extension survives the sync
  assert.equal(graph.elements.find((e) => e.id === 'UserTask_Capture')?.audit.owner, 'Requester')
})

test('deleting shapes and flows on the canvas removes them from the semantic model', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const gone = new Set(['ManualTask_Return', 'Flow_No', 'Flow_Return_Capture'])
  const edited: DiagramSnapshot = {
    shapes: snapshot.shapes.filter((s) => !gone.has(s.id)),
    connections: snapshot.connections.filter((c) => !gone.has(c.id)),
  }
  syncDefinitions(moddle, definitions, edited)
  const { xml } = await moddle.toXML(definitions, { format: true })
  const graph = await graphOf(xml)
  for (const id of gone) {
    assert.ok(!graph.elements.some((e) => e.id === id))
    assert.ok(!graph.edges.some((e) => e.id === id))
    assert.ok(!xml.includes(`"${id}"`), `${id} still referenced`)
  }
  assert.ok(!xml.includes('>ManualTask_Return<'))
})

test('a new canvas element gets semantic placement and DI', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const task = moddle.create('bpmn:ServiceTask', { id: 'ServiceTask_New', name: 'Post to ledger' })
  const flow = moddle.create('bpmn:SequenceFlow', { id: 'Flow_New' })
  snapshot.shapes.push({
    id: 'ServiceTask_New',
    type: 'bpmn:ServiceTask',
    businessObject: task,
    parentId: 'Lane_Finance',
    bounds: { x: 1000, y: 390, width: 100, height: 80 },
  })
  const connections = [
    ...snapshot.connections,
    {
      id: 'Flow_New',
      type: 'bpmn:SequenceFlow',
      businessObject: flow,
      parentId: 'Participant_Requisition',
      sourceId: 'EndEvent_Issued',
      targetId: 'ServiceTask_New',
      waypoints: [
        { x: 968, y: 430 },
        { x: 1000, y: 430 },
      ],
    },
  ]
  syncDefinitions(moddle, definitions, { shapes: snapshot.shapes, connections })
  const { xml } = await moddle.toXML(definitions, { format: true })
  const graph = await graphOf(xml)
  const added = graph.elements.find((e) => e.id === 'ServiceTask_New')
  assert.equal(added?.laneId, 'Lane_Finance')
  assert.deepEqual(
    graph.edges.find((e) => e.id === 'Flow_New'),
    { id: 'Flow_New', sourceId: 'EndEvent_Issued', targetId: 'ServiceTask_New', kind: 'sequence' },
  )
  assert.match(xml, /id="ServiceTask_New_di" bpmnElement="ServiceTask_New"/)
  assert.match(xml, /id="Flow_New_di" bpmnElement="Flow_New"/)
  const reloaded = await load(xml)
  const plan = planDiagram(reloaded.definitions)
  assert.deepEqual(plan.warnings, [])
  assert.equal(plan.shapes.find((s) => s.id === 'ServiceTask_New')?.parentId, 'Lane_Finance')
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createModdle } from '../lib/bpmn/trace-moddle.ts'
import { parseBpmnXml } from '../lib/bpmn/graph.ts'
import { planDiagram, type DiagramPlan } from '../lib/bpmn/editor/diagram-plan.ts'
import { syncDefinitions, type DiagramSnapshot, type SnapshotShape } from '../lib/bpmn/editor/semantic-sync.ts'
import { applyRootSwap, revertRootSwap } from '../lib/bpmn/editor/pool-wrap.ts'
import { PROCESS_FLOW_SEED_XML } from '../data/mock/process-flow-seed.ts'

async function load(xml: string) {
  const moddle = createModdle()
  const { rootElement } = await moddle.fromXML(xml)
  return { moddle, definitions: rootElement }
}

function snapshotOf(plan: DiagramPlan): { shapes: SnapshotShape[]; connections: DiagramSnapshot['connections'][number][] } {
  return {
    shapes: plan.shapes.map((s) => ({ ...s, bounds: { ...s.bounds } })),
    connections: plan.connections.map((c) => ({ ...c, waypoints: c.waypoints.map((p) => ({ ...p })) })),
  }
}

async function graphOf(xml: string) {
  const result = await parseBpmnXml(xml)
  assert.ok(result.ok, result.ok ? '' : result.error)
  return result.graph
}

/** Every `xxxRef="id"` / `<xxxRef>id<` / `bpmnElement="id"` must name an element defined in the XML. */
function danglingRefs(xml: string): string[] {
  const ids = new Set([...xml.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  const refs = [
    ...[...xml.matchAll(/(?:sourceRef|targetRef|processRef|bpmnElement)="([^"]+)"/g)].map((m) => m[1]),
    ...[...xml.matchAll(/<bpmn:(?:flowNodeRef|incoming|outgoing)>([^<]+)</g)].map((m) => m[1]),
  ]
  return refs.filter((ref) => !ids.has(ref))
}

test('deleting a pool removes its process, its message flows and leaves no dangling references', async () => {
  // A message flow without DI (never drawn) also points into the pool.
  const xml = PROCESS_FLOW_SEED_XML.replace(
    '</bpmn:collaboration>',
    '<bpmn:messageFlow id="MessageFlow_Hidden" sourceRef="Participant_Supplier" targetRef="UserTask_Review" /></bpmn:collaboration>',
  )
  const { moddle, definitions } = await load(xml)
  const snapshot = snapshotOf(planDiagram(definitions))
  const shapes = snapshot.shapes.filter((s) => s.id === 'Participant_Supplier')
  const kept = new Set(shapes.map((s) => s.id))
  const connections = snapshot.connections.filter((c) => kept.has(c.sourceId) && kept.has(c.targetId))
  syncDefinitions(moddle, definitions, { shapes, connections })
  const out = (await moddle.toXML(definitions, { format: true })).xml

  assert.ok(!out.includes('Process_Requisition'), 'no orphan process')
  assert.ok(!out.includes('MessageFlow_PO'), 'drawn message flow removed')
  assert.ok(!out.includes('MessageFlow_Hidden'), 'undrawn message flow into the pool removed')
  assert.ok(!out.includes('Lane_'), 'lanes gone with the pool')
  assert.deepEqual(danglingRefs(out), [])
  const graph = await graphOf(out)
  assert.deepEqual(graph.elements, [])
  assert.deepEqual(graph.edges, [])
  const reloaded = await load(out)
  assert.deepEqual(planDiagram(reloaded.definitions).warnings, [])
})

test('deleting a lane keeps its steps at pool level and out of every lane', async () => {
  const { moddle, definitions } = await load(PROCESS_FLOW_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const shapes = snapshot.shapes
    .filter((s) => s.id !== 'Lane_LineManager')
    .map((s) => (s.parentId === 'Lane_LineManager' ? { ...s, parentId: 'Participant_Requisition' } : s))
  syncDefinitions(moddle, definitions, { shapes, connections: snapshot.connections })
  const out = (await moddle.toXML(definitions, { format: true })).xml

  const graph = await graphOf(out)
  for (const id of ['UserTask_Review', 'Gateway_Approved']) {
    const element = graph.elements.find((e) => e.id === id)
    assert.ok(element, `${id} survives`)
    assert.equal(element.laneId, undefined)
    assert.ok(!out.includes(`<bpmn:flowNodeRef>${id}<`), `${id} is in no lane`)
  }
  assert.ok(!out.includes('Lane_LineManager'))
  assert.equal(graph.edges.length, 8, 'every flow kept')
  assert.deepEqual(danglingRefs(out), [])
  const plan = planDiagram((await load(out)).definitions)
  assert.equal(plan.shapes.find((s) => s.id === 'UserTask_Review')?.parentId, 'Participant_Requisition')
})

test('a new pool brings its own process into the definitions', async () => {
  const { moddle, definitions } = await load(PROCESS_FLOW_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const process = moddle.create('bpmn:Process', { id: 'Process_New', isExecutable: false })
  const participant = moddle.create('bpmn:Participant', { id: 'Participant_New', processRef: process })
  const task = moddle.create('bpmn:Task', { id: 'Task_New', name: 'Pay supplier' })
  snapshot.shapes.push(
    { id: 'Participant_New', type: 'bpmn:Participant', businessObject: participant, parentId: null, bounds: { x: 160, y: 700, width: 600, height: 250 } },
    { id: 'Task_New', type: 'bpmn:Task', businessObject: task, parentId: 'Participant_New', bounds: { x: 300, y: 780, width: 100, height: 80 } },
  )
  syncDefinitions(moddle, definitions, snapshot)
  const out = (await moddle.toXML(definitions, { format: true })).xml
  assert.match(out, /<bpmn:process id="Process_New"[^>]*>\s*<bpmn:task id="Task_New"/)
  assert.match(out, /<bpmn:participant id="Participant_New" processRef="Process_New"/)
  assert.deepEqual(danglingRefs(out), [])
  assert.ok((await graphOf(out)).elements.some((e) => e.id === 'Task_New'))
})

const PROCESS_ONLY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Defs_P" targetNamespace="http://example.com/bpmn">
  <bpmn:process id="Proc_Only" isExecutable="false">
    <bpmn:startEvent id="Start_1" />
    <bpmn:task id="Task_1" name="Do it" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_P">
    <bpmndi:BPMNPlane id="Plane_P" bpmnElement="Proc_Only">
      <bpmndi:BPMNShape id="Start_1_di" bpmnElement="Start_1"><dc:Bounds x="200" y="200" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="300" y="178" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="236" y="218" /><di:waypoint x="300" y="218" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

test('wrapping a process-only diagram in a pool keeps every step and flow', async () => {
  const { moddle, definitions } = await load(PROCESS_ONLY_XML)
  const before = await graphOf(PROCESS_ONLY_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const process = definitions.rootElements[0]
  const collaboration = moddle.create('bpmn:Collaboration', { id: 'Collaboration_W', participants: [] })
  const participant = moddle.create('bpmn:Participant', { id: 'Participant_W', processRef: process })

  applyRootSwap(definitions, collaboration)
  const shapes: SnapshotShape[] = [
    { id: 'Participant_W', type: 'bpmn:Participant', businessObject: participant, parentId: null, bounds: { x: 130, y: 140, width: 330, height: 160 } },
    ...snapshot.shapes.map((s) => ({ ...s, parentId: 'Participant_W' })),
  ]
  const connections = snapshot.connections.map((c) => ({ ...c, parentId: 'Participant_W' }))
  syncDefinitions(moddle, definitions, { shapes, connections })
  const out = (await moddle.toXML(definitions, { format: true })).xml

  assert.deepEqual(await graphOf(out), before)
  assert.match(out, /<bpmn:participant id="Participant_W" processRef="Proc_Only"/)
  assert.match(out, /bpmnElement="Collaboration_W"/)
  assert.deepEqual(danglingRefs(out), [])
  const plan = planDiagram((await load(out)).definitions)
  assert.equal(plan.root.type, 'bpmn:Collaboration')
  assert.equal(plan.shapes.find((s) => s.id === 'Task_1')?.parentId, 'Participant_W')

  revertRootSwap(definitions, collaboration, process)
  assert.equal(definitions.diagrams[0].plane.bpmnElement, process)
  assert.ok(!definitions.rootElements.includes(collaboration))
})

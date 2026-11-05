import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyProcessXml, parseBpmnXml, setAuditFieldsInXml } from '../lib/bpmn/graph.ts'
import { buildCompareXml } from '../lib/bpmn/compare.ts'
import { createModdle } from '../lib/bpmn/trace-moddle.ts'
import { computeMetrics } from '../modules/process-flows/metrics.ts'
import type { AuditFields } from '../types/process-flow.ts'

const FOREIGN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Defs_1" targetNamespace="http://example.com/bpmn">
  <bpmn:collaboration id="Collab_1">
    <bpmn:participant id="Part_1" name="Finance" processRef="Proc_1" />
    <bpmn:participant id="Part_2" name="Supplier" processRef="Proc_2" />
    <bpmn:messageFlow id="Msg_1" name="Invoice" sourceRef="Task_2" targetRef="Task_3" />
  </bpmn:collaboration>
  <bpmn:process id="Proc_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_A" name="Clerk">
        <bpmn:flowNodeRef>Start_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_1</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_B" name="Manager">
        <bpmn:flowNodeRef>Task_2</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="Start_1" name="Invoice received" />
    <bpmn:task id="Task_1" name="Capture invoice" />
    <bpmn:userTask id="Task_2" name="Approve invoice" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" name="captured" sourceRef="Task_1" targetRef="Task_2" />
  </bpmn:process>
  <bpmn:process id="Proc_2" isExecutable="false">
    <bpmn:task id="Task_3" name="Send invoice" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collab_1">
      <bpmndi:BPMNShape id="Shape_Task_1" bpmnElement="Task_1">
        <dc:Bounds x="321" y="123" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_2" bpmnElement="Task_2">
        <dc:Bounds x="555" y="123" width="100" height="80" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

const FULL_FIELDS: AuditFields = {
  owner: 'AP Clerk',
  system: 'SAP',
  input: 'Paper invoice',
  output: 'Captured invoice',
  workMinutes: 12.5,
  waitMinutes: 240,
  approvalRequired: true,
  control: 'Three-way match',
  painPoint: 'Manual re-keying & "double" entry <risk>',
  evidenceIds: ['ev-1', 'ev-2'],
}

test('round-trips audit fields through XML', async () => {
  const xml = await setAuditFieldsInXml(FOREIGN_XML, 'Task_1', FULL_FIELDS)
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  const task = parsed.graph.elements.find((e) => e.id === 'Task_1')
  assert.deepEqual(task?.audit, FULL_FIELDS)

  const boolFalse = await setAuditFieldsInXml(xml, 'Task_1', {
    approvalRequired: false,
    workMinutes: 0,
    evidenceIds: [],
  })
  const reparsed = await parseBpmnXml(boolFalse)
  assert.ok(reparsed.ok)
  assert.deepEqual(reparsed.graph.elements.find((e) => e.id === 'Task_1')?.audit, {
    approvalRequired: false,
    workMinutes: 0,
    evidenceIds: [],
  })
})

test('setAuditFieldsInXml keeps the rest of the XML intact', async () => {
  const xml = await setAuditFieldsInXml(FOREIGN_XML, 'Task_1', FULL_FIELDS)
  assert.match(xml, /x="321"/)
  assert.match(xml, /y="123"/)
  assert.match(xml, /Shape_Task_2/)
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  assert.equal(parsed.graph.elements.length, 4)
  assert.equal(parsed.graph.edges.length, 3)
  const other = parsed.graph.elements.find((e) => e.id === 'Task_2')
  assert.deepEqual(other?.audit, { evidenceIds: [] })
  await assert.rejects(setAuditFieldsInXml(FOREIGN_XML, 'Nope', FULL_FIELDS))
})

test('parses lanes into laneId and flows into edges', async () => {
  const parsed = await parseBpmnXml(FOREIGN_XML)
  assert.ok(parsed.ok)
  const byId = new Map(parsed.graph.elements.map((e) => [e.id, e]))
  assert.equal(byId.get('Start_1')?.laneId, 'Lane_A')
  assert.equal(byId.get('Task_1')?.laneId, 'Lane_A')
  assert.equal(byId.get('Task_2')?.laneId, 'Lane_B')
  assert.equal(byId.get('Task_3')?.laneId, undefined)
  assert.equal(byId.get('Task_2')?.bpmnType, 'bpmn:UserTask')
  assert.equal(byId.get('Task_1')?.name, 'Capture invoice')

  const edges = new Map(parsed.graph.edges.map((e) => [e.id, e]))
  assert.deepEqual(edges.get('Flow_1'), {
    id: 'Flow_1',
    sourceId: 'Start_1',
    targetId: 'Task_1',
    kind: 'sequence',
  })
  assert.equal(edges.get('Flow_2')?.label, 'captured')
  assert.equal(edges.get('Flow_2')?.kind, 'sequence')
  assert.equal(edges.get('Msg_1')?.kind, 'message')
  assert.equal(edges.get('Msg_1')?.sourceId, 'Task_2')
  assert.equal(edges.get('Msg_1')?.targetId, 'Task_3')
  assert.equal(parsed.graph.edges.length, 3)
})

test('moving a node between lanes in XML changes its laneId', async () => {
  // Hand edit: Task_2 leaves Lane_B ("Manager") for Lane_A ("Clerk").
  const edited = FOREIGN_XML.replace(
    /\s*<bpmn:flowNodeRef>Task_2<\/bpmn:flowNodeRef>/,
    '',
  ).replace(
    '<bpmn:flowNodeRef>Task_1</bpmn:flowNodeRef>',
    '<bpmn:flowNodeRef>Task_1</bpmn:flowNodeRef>\n        <bpmn:flowNodeRef>Task_2</bpmn:flowNodeRef>',
  )
  assert.notEqual(edited, FOREIGN_XML)
  const before = await parseBpmnXml(FOREIGN_XML)
  const after = await parseBpmnXml(edited)
  assert.ok(before.ok && after.ok)
  assert.equal(before.graph.elements.find((e) => e.id === 'Task_2')?.laneId, 'Lane_B')
  assert.equal(after.graph.elements.find((e) => e.id === 'Task_2')?.laneId, 'Lane_A')
  // Task_1 -> Task_2 no longer crosses lanes, so the hand-off disappears.
  assert.equal(computeMetrics(before.graph).handoffs, 1)
  assert.equal(computeMetrics(after.graph).handoffs, 0)
})

test('foreign BPMN without TRACE data yields empty audit fields', async () => {
  const parsed = await parseBpmnXml(FOREIGN_XML)
  assert.ok(parsed.ok)
  assert.ok(parsed.graph.elements.length > 0)
  for (const element of parsed.graph.elements) {
    assert.deepEqual(element.audit, { evidenceIds: [] })
  }
})

test('malformed XML returns ok:false with a message', async () => {
  const result = await parseBpmnXml('<bpmn:definitions><unclosed')
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.length > 0)
})

test('empty string returns ok:false', async () => {
  const result = await parseBpmnXml('')
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.length > 0)
})

test('parseBpmnXml never throws for junk input', async () => {
  const junk: unknown[] = ['   \n\t ', 'not xml at all', '<a/>', '<?xml version="1.0"?>', null, undefined, 42, {}]
  for (const input of junk) {
    const result = await parseBpmnXml(input as string)
    assert.equal(typeof result.ok, 'boolean')
    if (!result.ok) assert.ok(result.error.length > 0)
  }
})

test('emptyProcessXml parses ok with zero elements', async () => {
  const xml = await emptyProcessXml('Order to Cash')
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  assert.equal(parsed.graph.elements.length, 0)
  assert.equal(parsed.graph.edges.length, 0)
  assert.match(xml, /Order to Cash/)
  assert.match(xml, /bpmn:participant /)
  assert.doesNotMatch(xml, /bpmn:lane /)
  assert.match(xml, /bpmndi:BPMNPlane/)
  assert.match(xml, /bpmndi:BPMNShape/)
})

test('createModdle registers the trace extension', async () => {
  const moddle = createModdle()
  const fields = moddle.create('trace:AuditFields', { owner: 'x' })
  assert.equal(fields.$type, 'trace:AuditFields')
  assert.equal(fields.owner, 'x')
})

test('buildCompareXml contains the removed element ids and still parses', async () => {
  const toBe = await setAuditFieldsInXml(
    FOREIGN_XML.replace(/<bpmn:task id="Task_1"[^>]*\/>/, '').replace(
      /<bpmn:sequenceFlow id="Flow_[12]"[^>]*\/>/g,
      '',
    ),
    'Task_2',
    { owner: 'Manager', evidenceIds: [] },
  )
  const xml = await buildCompareXml(FOREIGN_XML, toBe, ['Task_1'])
  assert.match(xml, /id="Task_1"/)
  assert.match(xml, /x="321"/)
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  assert.ok(parsed.graph.elements.some((e) => e.id === 'Task_1'))
  assert.equal(parsed.graph.elements.find((e) => e.id === 'Task_2')?.audit.owner, 'Manager')
})

test('buildCompareXml ignores unknown ids and ids already present', async () => {
  const xml = await buildCompareXml(FOREIGN_XML, FOREIGN_XML, ['Ghost', 'Task_1'])
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  assert.equal(parsed.graph.elements.filter((e) => e.id === 'Task_1').length, 1)
  assert.ok(!parsed.graph.elements.some((e) => e.id === 'Ghost'))
})

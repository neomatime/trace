import test from 'node:test'
import assert from 'node:assert/strict'
import { NAME_MAX_LENGTH, normalizeElementName } from '../lib/bpmn/editor/label-name.ts'
import { createModdle } from '../lib/bpmn/trace-moddle.ts'
import { parseBpmnXml } from '../lib/bpmn/graph.ts'
import { planDiagram, type DiagramPlan } from '../lib/bpmn/editor/diagram-plan.ts'
import { syncDefinitions, type DiagramSnapshot, type SnapshotShape } from '../lib/bpmn/editor/semantic-sync.ts'
import { SCRATCH_SEED_XML } from '../lib/bpmn/editor/__scratch-seed.ts'

test('trims leading and trailing whitespace', () => {
  assert.equal(normalizeElementName('  Check invoice  '), 'Check invoice')
})

test('collapses internal whitespace runs to single spaces', () => {
  assert.equal(normalizeElementName('Check    the \t  invoice'), 'Check the invoice')
})

test('newlines become single spaces', () => {
  assert.equal(normalizeElementName('Check\ninvoice'), 'Check invoice')
  assert.equal(normalizeElementName('Check\r\n\r\ninvoice'), 'Check invoice')
  assert.equal(normalizeElementName('a\n b \n\n c'), 'a b c')
})

test('empty, whitespace-only, tab-only and newline-only input clears the name', () => {
  assert.equal(normalizeElementName(''), undefined)
  assert.equal(normalizeElementName('     '), undefined)
  assert.equal(normalizeElementName('\t\t'), undefined)
  assert.equal(normalizeElementName('\n\n\r\n'), undefined)
})

test('the limit is 120 characters', () => {
  assert.equal(NAME_MAX_LENGTH, 120)
  const exactly = 'a'.repeat(120)
  assert.equal(normalizeElementName(exactly), exactly)
  assert.equal(normalizeElementName('a'.repeat(121)), exactly)
  assert.equal(normalizeElementName('a'.repeat(500)), exactly)
})

test('truncation happens after trimming and collapsing', () => {
  assert.equal(normalizeElementName(`   ${'a'.repeat(120)}   `), 'a'.repeat(120))
  assert.equal(normalizeElementName(`${' '.repeat(130)}text`), 'text')
  assert.equal(normalizeElementName(`${'a'.repeat(100)}${' '.repeat(50)}b`), `${'a'.repeat(100)} b`)
})

test('a truncated name never ends with a space', () => {
  // 119 letters + a space + more text: cutting at 120 would leave a trailing space
  assert.equal(normalizeElementName(`${'a'.repeat(119)} bbb`), 'a'.repeat(119))
})

test('keeps unicode text and does not split surrogate pairs at the limit', () => {
  assert.equal(normalizeElementName('  Prüfung der Rechnung — ✓  '), 'Prüfung der Rechnung — ✓')
  const emoji = normalizeElementName('😀'.repeat(200))
  assert.ok(emoji !== undefined)
  assert.ok(emoji.length <= 120)
  assert.ok(!/[\ud800-\udbff]$/.test(emoji), 'no lone high surrogate at the end')
  assert.ok([...emoji].every((c) => c === '😀'))
})

test('markup is not interpreted, only normalised', () => {
  assert.equal(normalizeElementName('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>')
})

// ---- model level: a rename reaches the exported XML and parses back ----

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

test('a renamed task, lane, pool and flow round-trip through the exported XML, special characters included', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const shape = (id: string) => snapshot.shapes.find((s) => s.id === id)!.businessObject
  const task = 'Check "PO" & <approve> 5 > 3'
  // exactly what the rename command does: set the normalised name on the business object
  shape('UserTask_Review').name = normalizeElementName(`  ${task} \n `)
  shape('Lane_LineManager').name = normalizeElementName('Line   Manager')
  shape('Participant_Requisition').name = normalizeElementName('Requisition & Approval')
  const flow = snapshot.connections.find((c) => c.type === 'bpmn:SequenceFlow')!
  flow.businessObject.name = normalizeElementName('Yes')

  syncDefinitions(moddle, definitions, snapshot)
  const xml = (await moddle.toXML(definitions, { format: true })).xml

  // moddle writes named or numeric entities; either is valid XML, a raw character is not
  const tag = xml.match(/<bpmn:userTask id="UserTask_Review" name="([^"]*)"/)
  assert.ok(tag, 'the task carries a name attribute')
  assert.match(tag[1], /^Check (&quot;|&#34;)PO(&quot;|&#34;) (&amp;|&#38;) (&lt;|&#60;)approve(&gt;|&#62;) 5 (&gt;|&#62;) 3$/)
  assert.ok(!xml.includes('<approve>'), 'no raw markup leaks into the XML')
  assert.match(xml, /name="Requisition (&amp;|&#38;) Approval"/)

  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok, parsed.ok ? '' : parsed.error)
  assert.equal(parsed.graph.elements.find((e) => e.id === 'UserTask_Review')?.name, task)
  assert.equal(parsed.graph.edges.find((e) => e.id === flow.id)?.label, 'Yes')

  // lane and pool names survive a full re-import of the exported XML
  const reloaded = planDiagram((await load(xml)).definitions)
  assert.equal(reloaded.shapes.find((s) => s.id === 'Lane_LineManager')?.businessObject.name, 'Line Manager')
  assert.equal(reloaded.shapes.find((s) => s.id === 'Participant_Requisition')?.businessObject.name, 'Requisition & Approval')
})

test('clearing a name removes it from the XML and from the parsed graph', async () => {
  const { moddle, definitions } = await load(SCRATCH_SEED_XML)
  const snapshot = snapshotOf(planDiagram(definitions))
  const shape = snapshot.shapes.find((s) => s.id === 'UserTask_Review')!
  assert.ok(shape.businessObject.name, 'seed task starts named')
  shape.businessObject.name = normalizeElementName('   ')
  syncDefinitions(moddle, definitions, snapshot)
  const xml = (await moddle.toXML(definitions, { format: true })).xml
  const parsed = await parseBpmnXml(xml)
  assert.ok(parsed.ok)
  assert.equal(parsed.graph.elements.find((e) => e.id === 'UserTask_Review')?.name, '')
  const tag = xml.match(/<bpmn:userTask id="UserTask_Review"[^>]*>/)
  assert.ok(tag && !tag[0].includes('name='))
})

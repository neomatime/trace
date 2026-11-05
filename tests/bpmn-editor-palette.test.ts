import test from 'node:test'
import assert from 'node:assert/strict'
import { filterPalette, PALETTE_ENTRIES, paletteGroup } from '../lib/bpmn/editor/palette.ts'
import { STAGE1_SHAPE_TYPES } from '../lib/bpmn/editor/element-kinds.ts'

const labels = (entries: readonly { label: string }[]) => entries.map((e) => e.label)

test('the basics group holds Start, Task, Decision and End in that order', () => {
  assert.deepEqual(labels(paletteGroup('basics')), ['Start', 'Task', 'Decision', 'End'])
})

test('basics carry the BPMN name as secondary text', () => {
  const byLabel = new Map(paletteGroup('basics').map((e) => [e.label, e.bpmnName]))
  assert.equal(byLabel.get('Start'), 'Start event')
  assert.equal(byLabel.get('Task'), 'Task')
  assert.equal(byLabel.get('Decision'), 'Exclusive gateway')
  assert.equal(byLabel.get('End'), 'End event')
})

test('the more group lists the three specialised task types', () => {
  assert.deepEqual(
    paletteGroup('more').map((e) => e.bpmnType),
    ['bpmn:UserTask', 'bpmn:ManualTask', 'bpmn:ServiceTask'],
  )
})

test('every entry creates a Stage 1 flow node; pools and lanes are not offered yet', () => {
  const stage1 = new Set<string>(STAGE1_SHAPE_TYPES)
  for (const entry of PALETTE_ENTRIES) {
    assert.ok(stage1.has(entry.bpmnType), `${entry.bpmnType} is a Stage 1 type`)
    assert.notEqual(entry.bpmnType, 'bpmn:Participant')
    assert.notEqual(entry.bpmnType, 'bpmn:Lane')
  }
  assert.equal(new Set(PALETTE_ENTRIES.map((e) => e.id)).size, PALETTE_ENTRIES.length, 'ids are unique')
})

test('an empty or blank query returns every entry in palette order', () => {
  assert.deepEqual(filterPalette(''), [...PALETTE_ENTRIES])
  assert.deepEqual(filterPalette('   '), [...PALETTE_ENTRIES])
})

test('filters by plain-language name, case-insensitively', () => {
  assert.deepEqual(labels(filterPalette('DECI')), ['Decision'])
  assert.deepEqual(labels(filterPalette('end')), ['End'])
})

test('filters by BPMN name', () => {
  assert.deepEqual(labels(filterPalette('exclusive')), ['Decision'])
  assert.deepEqual(labels(filterPalette('x')), ['Decision'])
  assert.deepEqual(
    filterPalette('user task').map((e) => e.bpmnType),
    ['bpmn:UserTask'],
  )
})

test('a query matching several entries keeps palette order', () => {
  assert.deepEqual(
    filterPalette('task').map((e) => e.bpmnType),
    ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ManualTask', 'bpmn:ServiceTask'],
  )
})

test('a query that matches nothing returns an empty list', () => {
  assert.deepEqual(filterPalette('zebra'), [])
})

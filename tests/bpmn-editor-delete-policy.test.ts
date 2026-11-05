import test from 'node:test'
import assert from 'node:assert/strict'
import { deletableElements, resolveDeletable } from '../lib/bpmn/editor/delete-policy.ts'

const root = { id: 'r', type: 'bpmn:Collaboration' }
const pool = { id: 'p', type: 'bpmn:Participant', parent: root }
const lane = { id: 'l', type: 'bpmn:Lane', parent: pool }
const task = { id: 't', type: 'bpmn:Task', parent: lane }
const flow = { id: 'f', type: 'bpmn:SequenceFlow', parent: pool }

test('lanes, pools, steps and flows may all be deleted; the root may not', () => {
  assert.deepEqual(deletableElements([task, lane, flow, pool]), [task, lane, flow, pool])
  assert.deepEqual(deletableElements([root, lane]), [lane])
})

test('resolveDeletable follows the elements.delete rule result', () => {
  const selection = [task, lane]
  assert.deepEqual(resolveDeletable(true, selection), selection, 'true: all')
  assert.deepEqual(resolveDeletable(undefined, selection), selection, 'no rule: all')
  assert.deepEqual(resolveDeletable(false, selection), [], 'false: none')
  assert.deepEqual(resolveDeletable([task], selection), [task], 'array: exactly those')
  assert.deepEqual(resolveDeletable([], selection), [], 'empty array: none')
})

test('a selection with a lane resolves to the whole selection (Task 12 lifts the lane guard)', () => {
  const selection = [task, lane]
  assert.deepEqual(resolveDeletable(deletableElements(selection), selection), [task, lane])
})

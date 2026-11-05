import test from 'node:test'
import assert from 'node:assert/strict'
import { excludeLanes, resolveDeletable } from '../lib/bpmn/editor/delete-policy.ts'

const task = { id: 't', type: 'bpmn:Task' }
const lane = { id: 'l', type: 'bpmn:Lane' }
const flow = { id: 'f', type: 'bpmn:SequenceFlow' }
const pool = { id: 'p', type: 'bpmn:Participant' }

test('excludeLanes keeps everything but lanes', () => {
  assert.deepEqual(excludeLanes([task, lane, flow, pool]), [task, flow, pool])
  assert.deepEqual(excludeLanes([lane]), [])
})

test('resolveDeletable follows the elements.delete rule result', () => {
  const selection = [task, lane]
  assert.deepEqual(resolveDeletable(true, selection), selection, 'true: all')
  assert.deepEqual(resolveDeletable(undefined, selection), selection, 'no rule: all')
  assert.deepEqual(resolveDeletable(false, selection), [], 'false: none')
  assert.deepEqual(resolveDeletable([task], selection), [task], 'array: exactly those')
  assert.deepEqual(resolveDeletable([], selection), [], 'empty array: none')
})

test('a selection with a lane resolves to the selection without the lane', () => {
  const selection = [task, lane]
  assert.deepEqual(resolveDeletable(excludeLanes(selection), selection), [task])
})

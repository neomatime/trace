import test from 'node:test'
import assert from 'node:assert/strict'
import { findElementByName } from '../lib/bpmn/editor/element-search.ts'

const elements = [
  { id: 'a', name: 'Capture requisition' },
  { id: 'b', name: 'Review requisition' },
  { id: 'c', name: 'Approved?' },
  { id: 'd' },
  { id: 'e', name: 'Review' },
]

test('returns null for an empty query', () => {
  assert.equal(findElementByName(elements, ''), null)
  assert.equal(findElementByName(elements, '   '), null)
})

test('matches part of a name, case-insensitively, in diagram order', () => {
  assert.equal(findElementByName(elements, 'REQUIS'), 'a')
  assert.equal(findElementByName(elements, 'approved'), 'c')
})

test('prefers an exact name, then a name that starts with the query', () => {
  assert.equal(findElementByName(elements, 'review'), 'e')
  assert.equal(findElementByName(elements, 'rev'), 'b')
})

test('returns null when nothing matches and ignores unnamed elements', () => {
  assert.equal(findElementByName(elements, 'payment'), null)
})

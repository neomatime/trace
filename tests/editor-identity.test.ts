import test from 'node:test'
import assert from 'node:assert/strict'
import { identityKey } from '../components/process-flows/editor-identity.ts'

test('the same object always gets the same key', () => {
  const editor = {}
  assert.equal(identityKey(editor), identityKey(editor))
})

test('two editors never share a key, so panels keyed by it remount when the editor is swapped', () => {
  const asIs = {}
  const toBe = {}
  assert.notEqual(identityKey(asIs), identityKey(toBe))
  // the same element id under two editors yields two different React keys
  assert.notEqual(`${identityKey(asIs)}:Task_1`, `${identityKey(toBe)}:Task_1`)
})

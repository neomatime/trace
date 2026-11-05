import assert from 'node:assert/strict'
import { test } from 'node:test'
import { supportsProcessWorkflow } from '../modules/process-flows/workflow-support.ts'

test('Operational Flow audit ids support the process workflow', () => {
  assert.equal(supportsProcessWorkflow('TRC-OF-2026-0012'), true)
  assert.equal(supportsProcessWorkflow('TRC-OF-2026-9999'), true)
})

test('other audit types do not support the process workflow', () => {
  for (const id of [
    'TRC-WEB-2026-0042',
    'TRC-BRN-2026-0021',
    'TRC-DIG-2026-0018',
    'TRC-SEC-2026-0007',
    'TRC-CX-2026-0003',
    'TRC-PPL-2026-0004',
    'TRC-INT-2026-0005',
  ]) {
    assert.equal(supportsProcessWorkflow(id), false, id)
  }
})

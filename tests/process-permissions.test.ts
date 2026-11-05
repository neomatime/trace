import test from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission } from '../lib/auth/permissions.ts'

test('only Audit Lead and Admin can approve process flows', () => {
  assert.equal(hasPermission('Audit Lead', 'processflow:approve'), true)
  assert.equal(hasPermission('Admin', 'processflow:approve'), true)
  assert.equal(hasPermission('Reviewer', 'processflow:approve'), false)
  assert.equal(hasPermission('Auditor / Consultant', 'processflow:approve'), false)
  assert.equal(hasPermission('Viewer', 'processflow:approve'), false)
})

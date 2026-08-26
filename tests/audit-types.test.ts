import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AUDIT_TYPES,
  AUDIT_TYPE_IDS,
  AUDIT_TYPE_NAMES,
  getAuditType,
  getAuditTypeByName,
  getAuditTypeFromAuditId,
  isAuditTypeId,
  isAuditTypeName,
} from '../config/audit-types.ts'

const expected = [
  ['website', 'Website Audit'],
  ['brand', 'Brand Consistency Audit'],
  ['digital-presence', 'Digital Presence Audit'],
  ['operational-flow', 'Operational Flow Audit'],
  ['customer-experience', 'Customer Experience Audit'],
  ['people', 'People Audit'],
  ['intelligence', 'Intelligence Audit'],
] as const

test('TRACE exposes exactly the seven supported audit types', () => {
  assert.deepEqual(AUDIT_TYPE_IDS, expected.map(([id]) => id))
  assert.deepEqual(AUDIT_TYPE_NAMES, expected.map(([, name]) => name))
  assert.equal(AUDIT_TYPES.length, 7)
})

test('all seven values are accepted by application validation', () => {
  for (const [id, name] of expected) {
    assert.equal(isAuditTypeId(id), true)
    assert.equal(isAuditTypeName(name), true)
    assert.equal(getAuditType(id).name, name)
    assert.equal(getAuditTypeByName(name).id, id)
  }
  assert.equal(isAuditTypeId('unknown'), false)
  assert.equal(isAuditTypeName('customer_experience'), false)
})

test('every audit type carries the workflow configuration needed by TRACE', () => {
  for (const type of AUDIT_TYPES) {
    assert.ok(type.description.length > 20)
    assert.ok(type.detailFields.some(field => 'required' in field && field.required))
    assert.ok(type.scopeFields.some(field => 'required' in field && field.required))
    assert.ok(type.collectionAreas.length > 0)
    assert.ok(type.requiredEvidenceTypes.length > 0)
    assert.ok(type.stakeholderLabels.includes('Reviewer'))
    for (const tab of ['Findings','Recommendations','Actions','Evidence','Review','Reports','Reassessment'] as const) {
      assert.ok(type.supportedTabs.includes(tab), `${type.name} is missing ${tab}`)
    }
  }
})

test('new audit identifiers load the correct human-readable type', () => {
  assert.equal(getAuditTypeFromAuditId('TRC-CX-2026-0001').name, 'Customer Experience Audit')
  assert.equal(getAuditTypeFromAuditId('TRC-PPL-2026-0001').name, 'People Audit')
  assert.equal(getAuditTypeFromAuditId('TRC-INT-2026-0001').name, 'Intelligence Audit')
})

test('legacy brand labels remain readable without changing the canonical label', () => {
  assert.equal(getAuditTypeByName('Brand Audit').name, 'Brand Consistency Audit')
})

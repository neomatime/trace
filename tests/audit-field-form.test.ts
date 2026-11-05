import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MINUTES_ERROR,
  auditFieldsEqual,
  parseMinutes,
  setApprovalRequired,
  setMinutesField,
  setTextField,
} from '../components/process-flows/audit-field-form.ts'
import type { AuditFields } from '../types/process-flow.ts'

const base: AuditFields = {
  owner: 'Finance',
  system: 'ERP',
  workMinutes: 15,
  waitMinutes: 5,
  approvalRequired: false,
  evidenceIds: ['ev-001', 'ev-002'],
}

test('parseMinutes accepts whole numbers 0 or more', () => {
  assert.deepEqual(parseMinutes('15'), { ok: true, value: 15 })
  assert.deepEqual(parseMinutes('0'), { ok: true, value: 0 })
  assert.deepEqual(parseMinutes(' 42 '), { ok: true, value: 42 })
  assert.deepEqual(parseMinutes('007'), { ok: true, value: 7 })
})

test('parseMinutes treats empty and whitespace as clearing the value', () => {
  assert.deepEqual(parseMinutes(''), { ok: true, value: undefined })
  assert.deepEqual(parseMinutes('   '), { ok: true, value: undefined })
})

test('parseMinutes rejects negatives, decimals and non-numbers', () => {
  for (const text of ['-1', '1.5', '0.5', 'abc', '1e3', '12abc', '+', '-0', '1,5', 'NaN', 'Infinity']) {
    assert.deepEqual(parseMinutes(text), { ok: false, message: MINUTES_ERROR }, text)
  }
  assert.equal(MINUTES_ERROR, 'Enter a whole number of minutes, 0 or more.')
})

test('parseMinutes rejects numbers beyond the safe integer range', () => {
  assert.equal(parseMinutes('99999999999999999999').ok, false)
})

test('setMinutesField writes a valid value and keeps every other field', () => {
  const result = setMinutesField(base, 'workMinutes', '30')
  assert.equal(result.error, undefined)
  assert.deepEqual(result.fields, { ...base, workMinutes: 30 })
  assert.equal(result.fields.evidenceIds, base.evidenceIds)
})

test('setMinutesField clears with an empty string', () => {
  const result = setMinutesField(base, 'waitMinutes', '')
  assert.equal(result.error, undefined)
  assert.equal(result.fields.waitMinutes, undefined)
  assert.equal(result.fields.workMinutes, 15)
})

test('setMinutesField on invalid input returns the same fields object and an error', () => {
  for (const text of ['-1', '1.5', 'abc']) {
    const result = setMinutesField(base, 'workMinutes', text)
    assert.equal(result.fields, base, text)
    assert.equal(result.error, MINUTES_ERROR, text)
  }
})

test('setMinutesField returns the same object when nothing changes', () => {
  assert.equal(setMinutesField(base, 'workMinutes', '15').fields, base)
})

test('setTextField sets text and preserves evidenceIds and the other fields', () => {
  const next = setTextField(base, 'system', 'SAP')
  assert.deepEqual(next, { ...base, system: 'SAP' })
  assert.equal(next.evidenceIds, base.evidenceIds)
})

test('setTextField clears empty and whitespace-only text to undefined', () => {
  assert.equal(setTextField(base, 'owner', '').owner, undefined)
  assert.equal(setTextField(base, 'owner', '   \n ').owner, undefined)
  assert.equal(setTextField(base, 'painPoint', '').painPoint, undefined)
})

test('setTextField trims surrounding whitespace', () => {
  assert.equal(setTextField(base, 'control', '  Dual sign-off ').control, 'Dual sign-off')
})

test('setTextField returns the same object when nothing changes', () => {
  assert.equal(setTextField(base, 'system', 'ERP'), base)
  assert.equal(setTextField(base, 'painPoint', ''), base)
})

test('auditFieldsEqual compares by value and ignores undefined keys', () => {
  assert.equal(auditFieldsEqual(base, { ...base, evidenceIds: ['ev-001', 'ev-002'] }), true)
  assert.equal(auditFieldsEqual({ evidenceIds: [] }, { owner: undefined, evidenceIds: [] }), true)
  assert.equal(auditFieldsEqual(base, { ...base, system: 'SAP' }), false)
  assert.equal(auditFieldsEqual(base, { ...base, evidenceIds: ['ev-001'] }), false)
  assert.equal(auditFieldsEqual(base, { ...base, workMinutes: undefined }), false)
})

test('setApprovalRequired toggles on and off without touching other fields', () => {
  const on = setApprovalRequired(base, true)
  assert.equal(on.approvalRequired, true)
  assert.deepEqual({ ...on, approvalRequired: false }, base)
  const off = setApprovalRequired(on, false)
  assert.equal(off.approvalRequired, false)
  assert.equal(off.evidenceIds, base.evidenceIds)
})

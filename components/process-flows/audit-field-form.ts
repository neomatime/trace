/**
 * Pure rules for the audit-fields form: minutes parsing and building the next
 * `AuditFields` from one field change. No React or DOM, so it runs under node
 * for unit tests. Every setter returns the SAME object when nothing changes,
 * so callers can skip the write (and the undo step) with a reference check.
 */

import type { AuditFields } from '../../types/process-flow.ts'

export const MINUTES_ERROR = 'Enter a whole number of minutes, 0 or more.'

export type TextFieldKey = 'owner' | 'system' | 'input' | 'output' | 'control' | 'painPoint'
export type MinutesFieldKey = 'workMinutes' | 'waitMinutes'

export type MinutesParse = { ok: true; value: number | undefined } | { ok: false; message: string }

/**
 * Whole minutes, 0 or more. Blank clears the value (`undefined`). Anything
 * else (negative, decimal, exponent, letters, unsafe-large) is rejected.
 */
export function parseMinutes(text: string): MinutesParse {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: true, value: undefined }
  if (!/^\d+$/.test(trimmed)) return { ok: false, message: MINUTES_ERROR }
  const value = Number(trimmed)
  if (!Number.isSafeInteger(value)) return { ok: false, message: MINUTES_ERROR }
  return { ok: true, value }
}

function withValue<K extends TextFieldKey | MinutesFieldKey | 'approvalRequired'>(
  fields: AuditFields,
  key: K,
  value: AuditFields[K],
): AuditFields {
  if (fields[key] === value) return fields
  const next: AuditFields = { ...fields }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}

/** Surrounding whitespace is dropped; empty text clears the field (`undefined`). */
export function setTextField(fields: AuditFields, key: TextFieldKey, text: string): AuditFields {
  const trimmed = text.trim()
  return withValue(fields, key, trimmed === '' ? undefined : trimmed)
}

/** Invalid input returns the original fields untouched plus an error message. */
export function setMinutesField(
  fields: AuditFields,
  key: MinutesFieldKey,
  text: string,
): { fields: AuditFields; error?: string } {
  const parsed = parseMinutes(text)
  if (!parsed.ok) return { fields, error: parsed.message }
  return { fields: withValue(fields, key, parsed.value) }
}

/** Value equality (an absent key equals `undefined`; evidence ids compared in order). */
export function auditFieldsEqual(a: AuditFields, b: AuditFields): boolean {
  return (
    a.owner === b.owner &&
    a.system === b.system &&
    a.input === b.input &&
    a.output === b.output &&
    a.workMinutes === b.workMinutes &&
    a.waitMinutes === b.waitMinutes &&
    a.approvalRequired === b.approvalRequired &&
    a.control === b.control &&
    a.painPoint === b.painPoint &&
    a.evidenceIds.length === b.evidenceIds.length &&
    a.evidenceIds.every((id, i) => id === b.evidenceIds[i])
  )
}

export function setApprovalRequired(fields: AuditFields, required: boolean): AuditFields {
  return withValue(fields, 'approvalRequired', required)
}

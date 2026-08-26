'use client'

import { useMemo } from 'react'
import type { Audit } from '@/types/audit'

export function useAudit(auditId: string, audits: readonly Audit[] = []) {
  return useMemo(() => audits.find((audit) => audit.id === auditId) ?? null, [auditId, audits])
}

'use client'

import { useMemo } from 'react'
import type { Audit } from '@/types/audit'

export function useAudits(audits: readonly Audit[] = []) {
  return useMemo(() => ({ audits, count: audits.length }), [audits])
}

'use client'

import { useMemo } from 'react'
import type { Evidence } from '@/types/evidence'

export function useEvidence(assessmentId: string, evidence: readonly Evidence[] = []) {
  return useMemo(() => evidence.filter((item) => item.assessmentId === assessmentId), [assessmentId, evidence])
}

import type { Assessment } from '@/types/assessment'

export function isReassessment(assessment: Assessment): boolean {
  return assessment.kind === 'Reassessment'
}

import type { AssessmentReview, AssessmentReviewStatus } from '@/types/audit-governance'

const transitions: Record<AssessmentReviewStatus, readonly AssessmentReviewStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['In Review'],
  'In Review': ['Changes Requested', 'Approved'],
  'Changes Requested': ['Submitted'],
  Approved: ['Signed Off'],
  'Signed Off': [],
}

export function canTransitionReview(review: AssessmentReview, next: AssessmentReviewStatus) {
  if (!transitions[review.status].includes(next)) return false
  if ((next === 'Approved' || next === 'Signed Off') && review.openNotes > 0) return false
  return true
}

export function assertReviewTransition(review: AssessmentReview, next: AssessmentReviewStatus) {
  if (!canTransitionReview(review, next)) throw new Error(`Assessment review cannot move from ${review.status} to ${next}.`)
}

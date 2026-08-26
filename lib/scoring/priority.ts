export interface PriorityInputs {
  impact: number
  urgency: number
  risk: number
  effort: number
}

export function priorityScore({ impact, urgency, risk, effort }: PriorityInputs): number {
  return impact + urgency + risk - effort
}

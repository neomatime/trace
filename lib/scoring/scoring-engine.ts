export interface WeightedScore {
  score: number
  weight: number
}

export function calculateWeightedScore(values: readonly WeightedScore[]): number | null {
  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0)
  if (totalWeight <= 0) return null

  const weightedTotal = values.reduce((sum, value) => sum + value.score * value.weight, 0)
  return weightedTotal / totalWeight
}

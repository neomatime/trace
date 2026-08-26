export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function isScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100
}

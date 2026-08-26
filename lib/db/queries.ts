export interface QueryDefinition<TParameters extends readonly unknown[] = readonly unknown[]> {
  statement: string
  parameters: TParameters
}

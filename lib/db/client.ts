export interface DatabaseClient {
  query<TResult>(statement: string, parameters?: readonly unknown[]): Promise<readonly TResult[]>
}

import type { EntityId } from '@/types/common'

export interface EntityRepository<TEntity> {
  findById(id: EntityId): Promise<TEntity | null>
  list(): Promise<readonly TEntity[]>
  save(entity: TEntity): Promise<TEntity>
}

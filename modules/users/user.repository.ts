import type { EntityId } from '@/types/common'
import type { User } from '@/types/user'
import type { EntityRepository } from '@/modules/shared/repository'

export interface UserRepository extends EntityRepository<User> {
  listByOrganisation(organisationId: EntityId): Promise<readonly User[]>
}

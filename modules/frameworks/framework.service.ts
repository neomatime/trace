import type { FrameworkRepository } from './framework.repository'

export class FrameworkService {
  constructor(private readonly repository: FrameworkRepository) {}

  listFrameworks() {
    return this.repository.list()
  }
}

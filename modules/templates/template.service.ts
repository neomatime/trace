import type { TemplateRepository } from './template.repository'

export class TemplateService {
  constructor(private readonly repository: TemplateRepository) {}

  listTemplates() {
    return this.repository.list()
  }
}

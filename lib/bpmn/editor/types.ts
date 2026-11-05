import type { EntityId } from '../../../types/common.ts'
import type { AuditFields } from '../../../types/process-flow.ts'
import type { ValidationIssue } from '../../../modules/process-flows/validation.ts'

export type CompareState = 'added' | 'removed' | 'changed' | 'unchanged'

export interface ProcessEditor {
  importXml(xml: string): Promise<void>
  exportXml(): Promise<string>
  onSelection(cb: (elementId: EntityId | null) => void): () => void
  onChange(cb: () => void): () => void
  getAuditFields(elementId: EntityId): AuditFields
  setAuditFields(elementId: EntityId, fields: AuditFields): void
  setCompareStates(states: Readonly<Record<EntityId, CompareState>>): void
  setIssues(issues: readonly ValidationIssue[]): void
  fit(): void
  undo(): void
  redo(): void
  zoomBy(delta: number): void
  destroy(): void
}

/** didi module declaration as accepted by diagram-js (`import('didi').ModuleDeclaration`). */
export type EditorModule = Record<string, unknown>

export interface ProcessEditorOptions {
  readOnly: boolean
  /**
   * Extra diagram-js modules (palette, context pad, validation UI...) appended
   * after the TRACE core. Ignored in read-only mode.
   */
  additionalModules?: readonly EditorModule[]
}

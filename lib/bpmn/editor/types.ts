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

  // Task 10 additions (usability layer). All are safe to call in read-only
  // mode: editing calls do nothing there and the queries return false/null.

  /** Whether there is a change to undo / redo. */
  canUndo(): boolean
  canRedo(): boolean
  /** Select an element and centre it in the view. False if it is not on the canvas. */
  selectElement(elementId: EntityId): boolean
  /** Id of the best name match (exact, then starts-with, then contains), or null. */
  findElement(query: string): EntityId | null
  /** Start dragging a new element of `bpmnType` from a palette button. */
  startCreate(bpmnType: string, event: MouseEvent): void
  /**
   * Add a new element of `bpmnType` at a free spot near the centre of the
   * view (inside the lane/pool there, if any) and select it.
   */
  addElement(bpmnType: string): EntityId | null

  // Task 11 addition (properties panel).

  /**
   * Read-only facts about an element for display: its name, BPMN type and the
   * name of the nearest enclosing lane. Null if it is not on the canvas.
   */
  getElementInfo(elementId: EntityId): ElementInfo | null
}

export interface ElementInfo {
  name: string
  bpmnType: string
  laneName?: string
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

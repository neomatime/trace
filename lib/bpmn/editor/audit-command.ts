import type CommandStack from 'diagram-js/lib/command/CommandStack.js'
import type { Element } from 'diagram-js/lib/model/Types.js'
import type { ModdleElement } from 'bpmn-moddle'
import { applyAuditFields } from '../graph.ts'
import type { AuditFields } from '../../../types/process-flow.ts'
import type BpmnDocument from './document.ts'

export const UPDATE_AUDIT_FIELDS = 'trace.auditFields.update'

interface AuditContext {
  element: Element
  fields: AuditFields
  oldExtension?: ModdleElement
  oldValues?: ModdleElement[]
}

/** Undoable replacement of an element's `trace:AuditFields` extension. */
class UpdateAuditFieldsHandler {
  static $inject = ['bpmnDocument']

  private readonly document: BpmnDocument

  constructor(document: BpmnDocument) {
    this.document = document
  }

  execute(context: AuditContext): Element[] {
    const bo = context.element.businessObject as ModdleElement
    context.oldExtension = bo.extensionElements
    context.oldValues = bo.extensionElements ? [...bo.extensionElements.values] : undefined
    applyAuditFields(this.document.moddle, bo, context.fields)
    return [context.element]
  }

  revert(context: AuditContext): Element[] {
    const bo = context.element.businessObject as ModdleElement
    bo.extensionElements = context.oldExtension
    if (context.oldExtension) context.oldExtension.values = context.oldValues ?? []
    return [context.element]
  }
}

/** Registers TRACE command handlers on the command stack. */
export default class TraceCommands {
  static $inject = ['commandStack']

  constructor(commandStack: CommandStack) {
    commandStack.registerHandler(UPDATE_AUDIT_FIELDS, UpdateAuditFieldsHandler as never)
  }
}

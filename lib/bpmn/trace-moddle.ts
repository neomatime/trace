import { BpmnModdle } from 'bpmn-moddle'
import type { ModdlePackage } from 'bpmn-moddle'

export const TRACE_PREFIX = 'trace'
export const TRACE_URI = 'http://himark.co.za/schema/trace/1.0'

/**
 * Moddle descriptor for the TRACE extension. `trace:AuditFields` is stored as a
 * value of a BPMN element's `extensionElements` (any bpmn:BaseElement). Scalar
 * audit fields are XML attributes; evidence ids are `<trace:evidence ref="..."/>`
 * children so ids are never split or escaped ambiguously.
 */
export const traceModdlePackage: ModdlePackage = {
  name: 'TRACE',
  uri: TRACE_URI,
  prefix: TRACE_PREFIX,
  xml: { tagAlias: 'lowerCase' },
  types: [
    {
      name: 'AuditFields',
      superClass: ['Element'],
      properties: [
        { name: 'owner', isAttr: true, type: 'String' },
        { name: 'system', isAttr: true, type: 'String' },
        { name: 'input', isAttr: true, type: 'String' },
        { name: 'output', isAttr: true, type: 'String' },
        { name: 'workMinutes', isAttr: true, type: 'Real' },
        { name: 'waitMinutes', isAttr: true, type: 'Real' },
        { name: 'approvalRequired', isAttr: true, type: 'Boolean' },
        { name: 'control', isAttr: true, type: 'String' },
        { name: 'painPoint', isAttr: true, type: 'String' },
        { name: 'evidence', type: 'EvidenceRef', isMany: true },
      ],
    },
    {
      name: 'EvidenceRef',
      superClass: ['Element'],
      properties: [{ name: 'ref', isAttr: true, type: 'String' }],
    },
  ],
}

export function createModdle(): BpmnModdle {
  return new BpmnModdle({ [TRACE_PREFIX]: traceModdlePackage })
}

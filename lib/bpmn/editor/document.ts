import type { BpmnModdle, ModdleElement } from 'bpmn-moddle'
import { createModdle } from '../trace-moddle.ts'

/**
 * didi service holding the semantic model behind the canvas: one moddle
 * instance (with the TRACE extension) and the definitions of the last import.
 */
export default class BpmnDocument {
  readonly moddle: BpmnModdle = createModdle()
  definitions: ModdleElement | null = null

  private counter = 0

  /** A fresh, readable id such as `UserTask_k3x9a1`. */
  nextId(bpmnType: string): string {
    this.counter += 1
    const local = bpmnType.replace(/^bpmn:/, '')
    const salt = Math.random().toString(36).slice(2, 7)
    return `${local}_${salt}${this.counter.toString(36)}`
  }
}

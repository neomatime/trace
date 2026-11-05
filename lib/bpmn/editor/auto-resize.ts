import AutoResizeProvider from 'diagram-js/lib/features/auto-resize/AutoResizeProvider.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type { Shape } from 'diagram-js/lib/model/Types.js'
import { shapeKindOf } from './element-kinds.ts'

/**
 * Grows the frame a step is added to or moved into when the step lands past
 * (or near) its edge, so a flow built with quick-add never spills out:
 * - a lane grows, and the lane behaviour (lane-behaviour.ts) pushes the other
 *   lanes and grows the pool with it, horizontally and vertically;
 * - a pool (with or without lanes) grows, its lanes following.
 * Lanes themselves never trigger growth of their pool here: they are always
 * flush with it, and the lane behaviour already keeps the pool around them.
 */
export default class TraceAutoResizeProvider extends AutoResizeProvider {
  static $inject = ['eventBus']

  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  canResize(elements: Shape[], target: Shape): boolean {
    if (elements.some((element) => shapeKindOf(element.type) === 'lane')) return false
    const kind = shapeKindOf(target?.type ?? '')
    if (kind === 'lane') return true
    return kind === 'participant' && !!target.businessObject?.processRef
  }
}

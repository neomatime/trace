import AutoResizeProvider from 'diagram-js/lib/features/auto-resize/AutoResizeProvider.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type { Shape } from 'diagram-js/lib/model/Types.js'
import { shapeKindOf } from './element-kinds.ts'

/**
 * Grows a pool when steps are added or moved past its edge, so a flow built
 * with quick-add never spills out of its frame. Pools with lanes are left
 * alone: resizing them means resizing every lane, which arrives with lane
 * editing (Task 12).
 */
export default class TraceAutoResizeProvider extends AutoResizeProvider {
  static $inject = ['eventBus']

  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  canResize(_elements: Shape[], target: Shape): boolean {
    if (shapeKindOf(target?.type ?? '') !== 'participant' || !target.businessObject?.processRef) return false
    return !(target.children ?? []).some((child) => shapeKindOf(child.type) === 'lane')
  }
}

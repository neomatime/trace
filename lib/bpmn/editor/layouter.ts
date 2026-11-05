import BaseLayouter from 'diagram-js/lib/layout/BaseLayouter.js'
import type CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js'
import { getMid } from 'diagram-js/lib/layout/LayoutUtil.js'
import { connectRectangles } from 'diagram-js/lib/layout/ManhattanLayout.js'
import type { Connection, Shape } from 'diagram-js/lib/model/Types.js'
import type { Point } from 'diagram-js/lib/util/Types.js'

type LayoutHints = {
  source?: Shape
  target?: Shape
}

/**
 * Lays out new or re-attached connections: orthogonal (Manhattan) routes for
 * sequence flows, vertical-first routes for message flows between pools, both
 * cropped to the shape outlines so arrowheads touch the border.
 */
export default class TraceLayouter extends BaseLayouter {
  static $inject = ['connectionDocking']

  private readonly docking: CroppingConnectionDocking

  constructor(docking: CroppingConnectionDocking) {
    super()
    this.docking = docking
  }

  layoutConnection(connection: Connection, hints: LayoutHints = {}): Point[] {
    const source = (hints.source ?? connection.source) as Shape | undefined
    const target = (hints.target ?? connection.target) as Shape | undefined
    if (!source || !target) return super.layoutConnection(connection, hints)

    const start = getMid(source)
    const end = getMid(target)
    const preferredLayouts = connection.type === 'bpmn:MessageFlow' ? ['v:v'] : ['h:h']
    const waypoints = connectRectangles(source, target, start, end, { preferredLayouts }) ?? [start, end]

    return this.docking.getCroppedWaypoints({ ...connection, waypoints }, source, target)
  }
}

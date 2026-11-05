import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor.js'
import type EventBus from 'diagram-js/lib/core/EventBus.js'
import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type { Element } from 'diagram-js/lib/model/Types.js'
import { poolOf } from './rules.ts'

/**
 * Keeps the canvas tree in the shape the semantic sync expects: sequence flows
 * belong to their pool (or the root process), message flows to the root, no
 * matter which lane the source sits in.
 */
export default class TraceConnectionParentBehaviour extends CommandInterceptor {
  static $inject = ['eventBus', 'canvas']

  constructor(eventBus: EventBus, canvas: Canvas) {
    super(eventBus)

    const parentFor = (type: string | undefined, source: Element): Element => {
      const root = canvas.getRootElement() as Element
      if (type === 'bpmn:MessageFlow') return root
      return (poolOf(source) as Element | undefined) ?? root
    }

    this.preExecute('connection.create', (event: { context: { connection: Element; source: Element; parent?: Element } }) => {
      const { context } = event
      context.parent = parentFor(context.connection.type, context.source)
    })
  }
}

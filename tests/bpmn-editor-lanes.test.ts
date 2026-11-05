import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fitsInside,
  laneBody,
  layoutAfterLaneResize,
  layoutAfterPoolResize,
  layoutForNewLane,
  layoutIsValid,
  nextPoolBounds,
  POOL_HEADER,
  wrapBounds,
  type PoolItem,
} from '../lib/bpmn/editor/lane-layout.ts'
import { canDrop, connectionTypeBetween, poolOf } from '../lib/bpmn/editor/model-rules.ts'
import { lanesAmong, survivorsOfLaneDelete } from '../lib/bpmn/editor/delete-policy.ts'

// Pool at (100,100) 630x300 with three stacked lanes of 100 each.
const pool = { x: 100, y: 100, width: 630, height: 300 }
const lanes: PoolItem[] = [
  { id: 'A', kind: 'lane', bounds: { x: 130, y: 100, width: 600, height: 100 } },
  { id: 'B', kind: 'lane', bounds: { x: 130, y: 200, width: 600, height: 100 } },
  { id: 'C', kind: 'lane', bounds: { x: 130, y: 300, width: 600, height: 100 } },
]

test('the lane body is the pool minus its header', () => {
  assert.deepEqual(laneBody(pool), { x: 100 + POOL_HEADER, y: 100, width: 600, height: 300 })
})

test('growing a lane at the bottom pushes lower lanes down and grows the pool', () => {
  const layout = layoutAfterLaneResize(pool, lanes, 'A', { x: 130, y: 100, width: 600, height: 150 })
  assert.deepEqual(layout.pool, { x: 100, y: 100, width: 630, height: 350 })
  assert.deepEqual(layout.items.A, { x: 130, y: 100, width: 600, height: 150 })
  assert.deepEqual(layout.items.B, { x: 130, y: 250, width: 600, height: 100 })
  assert.deepEqual(layout.items.C, { x: 130, y: 350, width: 600, height: 100 })
})

test('growing a lane to the right widens the pool and every lane (pool growth)', () => {
  const layout = layoutAfterLaneResize(pool, lanes, 'B', { x: 130, y: 200, width: 800, height: 100 })
  assert.deepEqual(layout.pool, { x: 100, y: 100, width: 830, height: 300 })
  for (const id of ['A', 'B', 'C']) assert.equal(layout.items[id].width, 800, id)
  assert.equal(layout.items.C.y, 300, 'nothing moves vertically')
})

test('growing a lane upwards pushes upper lanes up and moves the pool top', () => {
  const layout = layoutAfterLaneResize(pool, lanes, 'B', { x: 130, y: 160, width: 600, height: 140 })
  assert.deepEqual(layout.pool, { x: 100, y: 60, width: 630, height: 340 })
  assert.deepEqual(layout.items.A, { x: 130, y: 60, width: 600, height: 100 })
  assert.deepEqual(layout.items.C, { x: 130, y: 300, width: 600, height: 100 })
})

test('pool-root nodes below a grown lane move with the lanes below it', () => {
  const items: PoolItem[] = [...lanes, { id: 'n', kind: 'node', bounds: { x: 400, y: 330, width: 100, height: 40 } }]
  const layout = layoutAfterLaneResize(pool, items, 'A', { x: 130, y: 100, width: 600, height: 120 })
  assert.deepEqual(layout.items.n, { x: 400, y: 350, width: 100, height: 40 })
})

test('resizing a pool stretches the edge lanes and keeps lanes flush with the body', () => {
  const layout = layoutAfterPoolResize(pool, { x: 80, y: 90, width: 700, height: 330 }, lanes)
  assert.deepEqual(layout.items.A, { x: 110, y: 90, width: 670, height: 110 })
  assert.deepEqual(layout.items.B, { x: 110, y: 200, width: 670, height: 100 })
  assert.deepEqual(layout.items.C, { x: 110, y: 300, width: 670, height: 120 })
})

test('the first lane of a pool fills its body', () => {
  const result = layoutForNewLane(pool, [], null, 'below')
  assert.deepEqual(result.lane, laneBody(pool))
  assert.deepEqual(result.layout.pool, pool)
})

test('adding a lane below one inserts it and grows the pool', () => {
  const result = layoutForNewLane(pool, lanes, 'A', 'below', 120)
  assert.deepEqual(result.lane, { x: 130, y: 200, width: 600, height: 120 })
  assert.deepEqual(result.layout.pool, { x: 100, y: 100, width: 630, height: 420 })
  assert.equal(result.layout.items.A.y, 100)
  assert.equal(result.layout.items.B.y, 320)
  assert.equal(result.layout.items.C.y, 420)
})

test('adding a lane above one inserts it at that lane and pushes it down', () => {
  const result = layoutForNewLane(pool, lanes, 'A', 'above', 120)
  assert.deepEqual(result.lane, { x: 130, y: 100, width: 600, height: 120 })
  assert.equal(result.layout.items.A.y, 220)
  assert.equal(result.layout.pool.height, 420)
})

test('a layout is refused when a lane would cut through one of its steps', () => {
  const task = { x: 600, y: 120, width: 100, height: 60 }
  const narrow = layoutAfterLaneResize(pool, lanes, 'A', { x: 130, y: 100, width: 500, height: 100 })
  assert.equal(layoutIsValid(narrow, lanes, { A: [task] }), false, 'right edge through the task')
  const low = layoutAfterLaneResize(pool, lanes, 'A', { x: 130, y: 100, width: 600, height: 70 })
  assert.equal(layoutIsValid(low, lanes, { A: [task] }), false, 'bottom edge through the task')
  const ok = layoutAfterLaneResize(pool, lanes, 'A', { x: 130, y: 100, width: 600, height: 90 })
  assert.equal(layoutIsValid(ok, lanes, { A: [task] }), true)
  const tooSmall = layoutAfterLaneResize(pool, lanes, 'C', { x: 130, y: 300, width: 600, height: 20 })
  assert.equal(layoutIsValid(tooSmall, lanes, {}), false, 'minimum lane height')
})

test('a pool resize is refused when it would leave a pool-level step outside', () => {
  const items: PoolItem[] = [{ id: 'n', kind: 'node', bounds: { x: 650, y: 150, width: 60, height: 40 } }]
  const shrunk = layoutAfterPoolResize(pool, { x: 100, y: 100, width: 500, height: 300 }, items)
  assert.equal(layoutIsValid(shrunk, items, {}), false)
  assert.equal(fitsInside({ x: 0, y: 0, width: 10, height: 10 }, [{ x: 2, y: 2, width: 8, height: 8 }]), true)
})

test('wrapBounds frames existing content with room for the header', () => {
  const frame = wrapBounds([
    { x: 200, y: 200, width: 36, height: 36 },
    { x: 300, y: 180, width: 100, height: 80 },
  ])
  assert.ok(frame)
  assert.ok(fitsInside(laneBody(frame), [{ x: 200, y: 180, width: 200, height: 80 }]))
  assert.equal(wrapBounds([]), null)
})

test('a new pool goes below the existing pools, or at the view centre on an empty canvas', () => {
  const size = { width: 600, height: 250 }
  assert.deepEqual(nextPoolBounds([], size, { x: 500, y: 400 }), { x: 200, y: 275, width: 600, height: 250 })
  const below = nextPoolBounds([pool, { x: 100, y: 450, width: 630, height: 100 }], size, { x: 0, y: 0 })
  assert.equal(below.x, 100)
  assert.ok(below.y >= 550 + 20, 'clear of the lowest pool')
})

// ---- connection and drop rules -------------------------------------------

interface Node {
  id: string
  type: string
  parent?: Node
  children?: Node[]
  businessObject?: { processRef?: object }
  incoming?: Node[]
  outgoing?: Node[]
  waypoints?: unknown[]
  source?: Node
  target?: Node
}

function world() {
  const root: Node = { id: 'root', type: 'bpmn:Collaboration', children: [] }
  const mk = (id: string, type: string, parent: Node, extra: Partial<Node> = {}): Node => {
    const node: Node = { id, type, parent, children: [], incoming: [], outgoing: [], ...extra }
    parent.children?.push(node)
    return node
  }
  const p1 = mk('P1', 'bpmn:Participant', root, { businessObject: { processRef: {} } })
  const laneA = mk('LA', 'bpmn:Lane', p1)
  const laneB = mk('LB', 'bpmn:Lane', p1)
  const p2 = mk('P2', 'bpmn:Participant', root, { businessObject: { processRef: {} } })
  const p3 = mk('P3', 'bpmn:Participant', root, { businessObject: { processRef: {} } })
  const t1 = mk('T1', 'bpmn:Task', laneA)
  const t2 = mk('T2', 'bpmn:Task', laneA)
  const t3 = mk('T3', 'bpmn:Task', p2)
  const flow = (id: string, type: string, source: Node, target: Node) => {
    const c: Node = { id, type, source, target, waypoints: [] }
    source.outgoing?.push(c)
    target.incoming?.push(c)
    return c
  }
  return { root, p1, p2, p3, laneA, laneB, t1, t2, t3, flow }
}

test('message flows join different pools only; sequence flows never cross pools', () => {
  const { p1, p2, t1, t2, t3 } = world()
  assert.equal(connectionTypeBetween(t1, t3), 'bpmn:MessageFlow', 'cross-pool')
  assert.equal(connectionTypeBetween(t1, t2), 'bpmn:SequenceFlow', 'same pool')
  assert.notEqual(connectionTypeBetween(t1, t3), 'bpmn:SequenceFlow')
  assert.equal(connectionTypeBetween(p1, p2), 'bpmn:MessageFlow', 'pool to pool')
  assert.equal(connectionTypeBetween(p1, t1), false, 'a pool and its own step')
  assert.equal(poolOf(t1), p1)
})

test('steps may be dropped into lanes and into pools with or without lanes', () => {
  const { p1, p2, laneB, t2 } = world()
  assert.equal(canDrop(t2, laneB), true, 'between lanes')
  assert.equal(canDrop(t2, p1), true, 'pool level of a pool with lanes')
  assert.equal(canDrop(t2, p2), true, 'a step without flows may change pool')
})

test('a step joined by sequence flows cannot leave its pool', () => {
  const { p2, laneB, t1, t2, flow } = world()
  flow('S', 'bpmn:SequenceFlow', t1, t2)
  assert.equal(canDrop(t2, p2), false)
  assert.equal(canDrop(t2, laneB), true)
})

test('a move that would put both ends of a message flow in one pool is refused', () => {
  const { p2, p3, t1, t3, flow } = world()
  flow('M', 'bpmn:MessageFlow', t1, t3)
  assert.equal(canDrop(t1, p2), false, 'into the other end’s pool')
  assert.equal(canDrop(t1, p3), true, 'into a third pool')
})

test('lanes and pools are never dropped into steps or lanes', () => {
  const { laneA, laneB, p1, root } = world()
  assert.equal(canDrop(laneA, laneB), false)
  assert.equal(canDrop(p1, laneA), false)
  assert.equal(canDrop(p1, root), true)
})

// ---- lane deletion --------------------------------------------------------

test('deleting a lane keeps its steps that are not deleted too', () => {
  const { laneA, t1, t2 } = world()
  assert.deepEqual(survivorsOfLaneDelete(laneA, [laneA]), [t1, t2])
  assert.deepEqual(survivorsOfLaneDelete(laneA, [laneA, t1]), [t2])
  assert.deepEqual(lanesAmong([t1, laneA]), [laneA])
})

test('deleting a lane keeps sequence flows that are children of the lane', () => {
  // diagram-js re-parents a flow into the lane when both ends are moved into
  // it together (e.g. when the first lane takes in a pool's steps).
  const { laneA, t1, t2, flow } = world()
  const seq = flow('S', 'bpmn:SequenceFlow', t1, t2)
  laneA.children?.push(seq)
  assert.deepEqual(survivorsOfLaneDelete(laneA, [laneA]), [t1, t2, seq])
  assert.deepEqual(survivorsOfLaneDelete(laneA, [laneA, seq]), [t1, t2], 'unless it is deleted too')
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { findAppendPosition } from '../lib/bpmn/editor/placement.ts'
import type { Rect } from '../lib/bpmn/editor/placement.ts'

const task = { width: 100, height: 80 }
const source: Rect = { x: 100, y: 100, width: 100, height: 80 } // mid (150, 140)

const boundsAt = (centre: { x: number; y: number }, size = task): Rect => ({
  x: centre.x - size.width / 2,
  y: centre.y - size.height / 2,
  width: size.width,
  height: size.height,
})

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

test('places the new element to the right of the source, centred on it', () => {
  const position = findAppendPosition({ source, size: task, obstacles: [] })
  assert.deepEqual(position, { x: 200 + 50 + 50, y: 140 })
})

test('centres smaller elements on the source mid line', () => {
  const position = findAppendPosition({ source, size: { width: 36, height: 36 }, obstacles: [] })
  assert.deepEqual(position, { x: 200 + 50 + 18, y: 140 })
})

test('moves below an occupied slot (second branch of a decision)', () => {
  const first = boundsAt({ x: 300, y: 140 })
  const position = findAppendPosition({ source, size: task, obstacles: [first] })
  assert.equal(position.x, 300)
  assert.ok(position.y > 140, 'goes below')
  assert.ok(!overlaps(boundsAt(position), first))
})

test('tries above when below is blocked', () => {
  const first = boundsAt({ x: 300, y: 140 })
  const below = boundsAt({ x: 300, y: 260 })
  const further = boundsAt({ x: 300, y: 380 })
  const position = findAppendPosition({ source, size: task, obstacles: [first, below, further] })
  assert.equal(position.x, 300)
  assert.ok(position.y < 140, 'goes above')
  for (const o of [first, below, further]) assert.ok(!overlaps(boundsAt(position), o))
})

test('stays inside the container (lane) vertically and shifts right when the column is full', () => {
  const lane: Rect = { x: 0, y: 80, width: 1000, height: 120 } // only one row fits
  const first = boundsAt({ x: 300, y: 140 })
  const position = findAppendPosition({ source, size: task, obstacles: [first], container: lane })
  const placed = boundsAt(position)
  assert.ok(placed.y >= lane.y && placed.y + placed.height <= lane.y + lane.height, 'inside lane')
  assert.ok(position.x > 300, 'shifted right')
  assert.ok(!overlaps(placed, first))
})

test('never overlaps any obstacle', () => {
  const obstacles: Rect[] = []
  for (let i = 0; i < 5; i += 1) obstacles.push(boundsAt({ x: 300, y: 140 + (i - 2) * 120 }))
  const position = findAppendPosition({ source, size: task, obstacles })
  for (const o of obstacles) assert.ok(!overlaps(boundsAt(position), o))
})

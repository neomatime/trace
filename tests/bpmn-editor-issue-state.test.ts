import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createLiveValidator,
  orderIssues,
  sameIssues,
  summarizeIssues,
} from '../lib/bpmn/editor/issue-state.ts'
import type { TimerApi } from '../lib/bpmn/editor/issue-state.ts'
import type { ValidationIssue } from '../modules/process-flows/validation.ts'

/** Manual clock: timers fire only when `advance` passes their due time. */
function fakeTimers() {
  let now = 0
  let nextId = 1
  const pending = new Map<number, { due: number; fn: () => void }>()
  const api: TimerApi = {
    setTimeout(fn, ms) {
      const id = nextId
      nextId += 1
      pending.set(id, { due: now + ms, fn })
      return id
    },
    clearTimeout(handle) {
      pending.delete(handle as number)
    },
  }
  return {
    api,
    advance(ms: number) {
      now += ms
      for (const [id, timer] of [...pending]) {
        if (timer.due <= now) {
          pending.delete(id)
          timer.fn()
        }
      }
    },
    count: () => pending.size,
  }
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve))

const warn = (message: string, elementId?: string): ValidationIssue => ({ severity: 'warning', message, elementId })
const error = (message: string, elementId?: string): ValidationIssue => ({ severity: 'error', message, elementId })

test('summarizeIssues counts errors and warnings', () => {
  assert.deepEqual(summarizeIssues([]), { errors: 0, warnings: 0, total: 0 })
  assert.deepEqual(summarizeIssues([error('a'), warn('b'), warn('c')]), { errors: 1, warnings: 2, total: 3 })
})

test('orderIssues lists errors before warnings and keeps order within a severity', () => {
  const list = [warn('w1'), error('e1'), warn('w2'), error('e2')]
  assert.deepEqual(orderIssues(list).map((i) => i.message), ['e1', 'e2', 'w1', 'w2'])
  assert.deepEqual(list.map((i) => i.message), ['w1', 'e1', 'w2', 'e2'], 'input untouched')
})

test('sameIssues compares content, ignoring order', () => {
  assert.equal(sameIssues([warn('a', 'x'), error('b')], [error('b'), warn('a', 'x')]), true)
  assert.equal(sameIssues([warn('a', 'x')], [warn('a', 'y')]), false)
  assert.equal(sameIssues([warn('a')], [error('a')]), false)
  assert.equal(sameIssues([warn('a')], [warn('a'), warn('a')]), false)
  assert.equal(sameIssues([], []), true)
})

test('runs once, 400 ms after the last change (debounce)', async () => {
  const clock = fakeTimers()
  const inputs: string[] = []
  const applied: string[] = []
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: async (input) => {
      inputs.push(input)
      return `result:${input}`
    },
    apply: (result) => applied.push(result),
  })
  validator.notify('v1')
  clock.advance(300)
  validator.notify('v2')
  clock.advance(300)
  await tick()
  assert.deepEqual(inputs, [], 'not yet: the timer restarted on v2')
  clock.advance(100)
  await tick()
  assert.deepEqual(inputs, ['v2'])
  assert.deepEqual(applied, ['result:v2'])
})

test('does not re-apply an equal result', async () => {
  const clock = fakeTimers()
  let applied = 0
  const validator = createLiveValidator<string, ValidationIssue[]>({
    delayMs: 400,
    timers: clock.api,
    produce: async () => [warn('This decision has only one path out.', 'g')],
    apply: () => {
      applied += 1
    },
    equals: sameIssues,
  })
  validator.notify('a')
  clock.advance(400)
  await tick()
  validator.notify('b')
  clock.advance(400)
  await tick()
  assert.equal(applied, 1)
})

test('discards a stale result when a newer change arrived while it was running', async () => {
  const clock = fakeTimers()
  const releases: Array<() => void> = []
  const applied: string[] = []
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: (input) =>
      new Promise<string>((resolve) => {
        releases.push(() => resolve(input))
      }),
    apply: (result) => applied.push(result),
  })
  validator.notify('old')
  clock.advance(400)
  validator.notify('new')
  releases[0]()
  await tick()
  assert.deepEqual(applied, [], 'old result dropped')
  clock.advance(400)
  releases[1]()
  await tick()
  assert.deepEqual(applied, ['new'])
})

test('a null result (could not check) keeps the previous issues', async () => {
  const clock = fakeTimers()
  const applied: string[] = []
  let next: string | null = 'first'
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: async () => next,
    apply: (result) => applied.push(result),
  })
  validator.notify('a')
  clock.advance(400)
  await tick()
  next = null
  validator.notify('b')
  clock.advance(400)
  await tick()
  assert.deepEqual(applied, ['first'])
})

test('flush runs a pending check immediately; dispose cancels everything', async () => {
  const clock = fakeTimers()
  const applied: string[] = []
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: async (input) => input,
    apply: (result) => applied.push(result),
  })
  validator.notify('now')
  await validator.flush()
  assert.deepEqual(applied, ['now'])
  assert.equal(clock.count(), 0, 'timer cleared by flush')

  validator.notify('later')
  validator.dispose()
  assert.equal(clock.count(), 0, 'timer cleared by dispose')
  clock.advance(1000)
  await tick()
  assert.deepEqual(applied, ['now'])
})

test('flush with nothing pending does nothing', async () => {
  const clock = fakeTimers()
  let runs = 0
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: async (input) => {
      runs += 1
      return input
    },
    apply: () => {},
  })
  await validator.flush()
  assert.equal(runs, 0)
})

test('a rejected check is reported and does not apply anything', async () => {
  const clock = fakeTimers()
  const failures: unknown[] = []
  const applied: string[] = []
  const validator = createLiveValidator<string, string>({
    delayMs: 400,
    timers: clock.api,
    produce: async () => {
      throw new Error('boom')
    },
    apply: (result) => applied.push(result),
    onError: (reason) => failures.push(reason),
  })
  validator.notify('a')
  await validator.flush()
  assert.equal(failures.length, 1)
  assert.deepEqual(applied, [])
})

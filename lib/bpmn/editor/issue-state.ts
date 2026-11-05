/**
 * Live validation plumbing for the editor: a debounced, stale-safe runner and
 * small helpers over validation issues. Pure (timers are injectable), so it
 * runs under node for unit tests.
 */

import type { ValidationIssue } from '../../../modules/process-flows/validation.ts'

export interface TimerApi {
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

const defaultTimers: TimerApi = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
}

export interface LiveValidatorOptions<I, T> {
  /** Quiet time after the last change before checking (400 ms in the editor). */
  delayMs: number
  timers?: TimerApi
  /** Check one input. `null` means "could not check": keep what is shown. */
  produce(input: I): Promise<T | null>
  /** Show a new result. Called only when it differs from the last one. */
  apply(result: T): void
  equals?(a: T, b: T): boolean
  onError?(reason: unknown): void
}

export interface LiveValidator<I> {
  /** Something changed: (re)start the quiet-time timer with the latest input. */
  notify(input: I): void
  /** Check the pending input now (e.g. right after an import). */
  flush(): Promise<void>
  /** Stop: cancel the timer and ignore checks still running. */
  dispose(): void
}

export function createLiveValidator<I, T>(options: LiveValidatorOptions<I, T>): LiveValidator<I> {
  const timers = options.timers ?? defaultTimers
  const equals = options.equals ?? ((a: T, b: T) => a === b)
  let handle: unknown = null
  let pending: { input: I } | null = null
  let generation = 0
  let disposed = false
  let shown: { result: T } | null = null

  const cancelTimer = () => {
    if (handle !== null) timers.clearTimeout(handle)
    handle = null
  }

  const run = async () => {
    cancelTimer()
    if (!pending || disposed) return
    const { input } = pending
    pending = null
    const started = generation
    let result: T | null
    try {
      result = await options.produce(input)
    } catch (reason) {
      if (!disposed) options.onError?.(reason)
      return
    }
    // A newer change arrived while this check ran: its own check will follow.
    if (disposed || started !== generation || result === null) return
    if (shown && equals(shown.result, result)) return
    shown = { result }
    options.apply(result)
  }

  return {
    notify(input) {
      if (disposed) return
      generation += 1
      pending = { input }
      cancelTimer()
      handle = timers.setTimeout(() => {
        handle = null
        void run()
      }, options.delayMs)
    },
    flush: run,
    dispose() {
      disposed = true
      pending = null
      cancelTimer()
    },
  }
}

export interface IssueSummary {
  errors: number
  warnings: number
  total: number
}

export function summarizeIssues(issues: readonly ValidationIssue[]): IssueSummary {
  const errors = issues.filter((issue) => issue.severity === 'error').length
  return { errors, warnings: issues.length - errors, total: issues.length }
}

/** Errors first, then warnings; stable within each severity. */
export function orderIssues(issues: readonly ValidationIssue[]): ValidationIssue[] {
  return [
    ...issues.filter((issue) => issue.severity === 'error'),
    ...issues.filter((issue) => issue.severity !== 'error'),
  ]
}

const issueKey = (issue: ValidationIssue) => `${issue.severity}\u0000${issue.elementId ?? ''}\u0000${issue.message}`

/** Same issues regardless of order (so unchanged results do not repaint badges). */
export function sameIssues(a: readonly ValidationIssue[], b: readonly ValidationIssue[]): boolean {
  if (a.length !== b.length) return false
  const left = a.map(issueKey).sort()
  const right = b.map(issueKey).sort()
  return left.every((key, index) => key === right[index])
}

import type Canvas from 'diagram-js/lib/core/Canvas.js'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry.js'
import type Overlays from 'diagram-js/lib/features/overlays/Overlays.js'
import type { EntityId } from '../../../types/common.ts'
import type { ValidationIssue } from '../../../modules/process-flows/validation.ts'
import type { CompareState } from './types.ts'

const COMPARE_MARKER: Record<CompareState, string | null> = {
  added: 'trace-compare-added',
  removed: 'trace-compare-removed',
  changed: 'trace-compare-changed',
  unchanged: null,
}

const ISSUE_OVERLAY = 'trace-issue'

/**
 * Applies compare-state markers (CSS classes on element graphics) and issue
 * badges (overlays) to the canvas. Re-applying replaces the previous set.
 */
export class CanvasMarkers {
  private applied = new Map<string, string>()

  constructor(
    private readonly canvas: Canvas,
    private readonly registry: ElementRegistry,
    private readonly overlays: Overlays,
  ) {}

  setCompareStates(states: Readonly<Record<EntityId, CompareState>>): void {
    for (const [id, marker] of this.applied) {
      if (this.registry.get(id)) this.canvas.removeMarker(id, marker)
    }
    this.applied.clear()
    for (const [id, state] of Object.entries(states)) {
      const marker = COMPARE_MARKER[state]
      if (!marker || !this.registry.get(id)) continue
      this.canvas.addMarker(id, marker)
      this.applied.set(id, marker)
    }
  }

  setIssues(issues: readonly ValidationIssue[]): void {
    this.overlays.remove({ type: ISSUE_OVERLAY })
    const byElement = new Map<string, ValidationIssue[]>()
    for (const issue of issues) {
      if (!issue.elementId || !this.registry.get(issue.elementId)) continue
      byElement.set(issue.elementId, [...(byElement.get(issue.elementId) ?? []), issue])
    }
    for (const [id, list] of byElement) {
      const severity = list.some((i) => i.severity === 'error') ? 'error' : 'warning'
      const badge = document.createElement('span')
      badge.className = `trace-issue-badge trace-issue-${severity}`
      badge.textContent = '!'
      badge.title = list.map((i) => i.message).join('\n')
      badge.setAttribute('role', 'img')
      badge.setAttribute('aria-label', `${list.length} ${severity === 'error' ? 'error' : 'warning'}: ${badge.title}`)
      this.overlays.add(id, ISSUE_OVERLAY, { position: { top: -8, right: 8 }, html: badge })
    }
  }

  /** Forget applied state after the canvas was cleared by an import. */
  reset(): void {
    this.applied.clear()
  }
}

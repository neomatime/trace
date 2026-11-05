import { CheckCircle2, FilePlus2, Pencil, Ruler, Sparkles, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import type { SuggestionStatus } from '@/types/process-flow'
import type { ProcessSuggestion } from '@/types/process-flow'

export const AI_LABEL = 'AI suggestion — needs review (demo data)'

const STATUS_STYLE: Record<SuggestionStatus, { className: string; label: string }> = {
  Proposed: { className: 'bg-brand-muted text-brand', label: 'Proposed — to review' },
  Accepted: { className: 'bg-success-muted text-success', label: 'Accepted' },
  Edited: { className: 'bg-info-muted text-info', label: 'Edited' },
  Rejected: { className: 'bg-muted text-muted-foreground', label: 'Rejected' },
}

const STATUS_ICON: Record<SuggestionStatus, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  Proposed: Sparkles,
  Accepted: CheckCircle2,
  Edited: Pencil,
  Rejected: XCircle,
}

export interface SuggestionCardProps {
  suggestion: ProcessSuggestion
  /** 1-based position in the suggested order of work, when the card is in that list. */
  step?: number
  /** Resolved names of the affected steps. */
  stepNames: readonly string[]
  canDecide: boolean
  canCreateRecommendation: boolean
  /** A recommendation has already been drafted from this suggestion. */
  drafted: boolean
  onAccept(): void
  onEdit(): void
  onReject(): void
  onCreateRecommendation(): void
}

const actionButton =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

export function SuggestionCard({
  suggestion,
  step,
  stepNames,
  canDecide,
  canCreateRecommendation,
  drafted,
  onAccept,
  onEdit,
  onReject,
  onCreateRecommendation,
}: SuggestionCardProps) {
  const { title, status } = suggestion
  const StatusIcon = STATUS_ICON[status]
  const isAi = suggestion.source === 'ai'
  const decided = status === 'Accepted' || status === 'Edited'

  return (
    <li
      aria-label={title}
      className={cn('rounded-lg border bg-card p-4', status === 'Rejected' ? 'border-border opacity-80' : 'border-border')}
    >
      <div className="flex flex-wrap items-center gap-2">
        {step !== undefined ? (
          <span
            aria-label={`Step ${step}`}
            className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {step}
          </span>
        ) : null}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
            isAi ? 'bg-brand-muted text-brand' : 'bg-muted text-muted-foreground',
          )}
        >
          {isAi ? <Sparkles className="size-3" aria-hidden /> : <Ruler className="size-3" aria-hidden />}
          {isAi ? AI_LABEL : 'Rule'}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
            STATUS_STYLE[status].className,
          )}
        >
          <StatusIcon className="size-3" aria-hidden />
          {STATUS_STYLE[status].label}
        </span>
        {drafted ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-success-muted px-2 py-0.5 text-xs font-medium text-success">
            <FilePlus2 className="size-3" aria-hidden />
            Recommendation drafted
          </span>
        ) : null}
      </div>

      <h4 className="mt-2 text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{suggestion.rationale}</p>
      <p className="mt-2 text-xs">
        <span className="font-semibold">Expected outcome: </span>
        {suggestion.expectedOutcome}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md border border-border px-2 py-0.5">Priority: {suggestion.priority}</span>
        <span className="rounded-md border border-border px-2 py-0.5">Effort: {suggestion.effort}</span>
      </div>

      {stepNames.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Affected steps: </span>
          {stepNames.join(', ')}
        </p>
      ) : null}

      {status === 'Proposed' && canDecide ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <button type="button" onClick={onAccept} aria-label={`Accept: ${title}`} className={actionButton}>
            <CheckCircle2 className="size-3.5" aria-hidden />
            Accept
          </button>
          <button type="button" onClick={onEdit} aria-label={`Edit: ${title}`} className={actionButton}>
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
          <button type="button" onClick={onReject} aria-label={`Reject: ${title}`} className={actionButton}>
            <XCircle className="size-3.5" aria-hidden />
            Reject
          </button>
        </div>
      ) : null}

      {decided && canCreateRecommendation && !drafted ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={onCreateRecommendation}
            aria-label={`Create recommendation: ${title}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <FilePlus2 className="size-3.5" aria-hidden />
            Create recommendation
          </button>
        </div>
      ) : null}
    </li>
  )
}

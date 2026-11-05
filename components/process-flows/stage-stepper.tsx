import { Check } from 'lucide-react'
import type { Stage } from '@/modules/process-flows/workspace-state'
import { cn } from '@/lib/utils'

/**
 * The seven-stage strip: As-Is Draft / In Review / Approved, To-Be Draft /
 * In Review / Approved, then Gaps & Recommendations. Stages come from
 * `stageStates()`; "Awaiting Client" shows as a note under "In Review".
 */
export function StageStepper({ stages, className }: { stages: readonly Stage[]; className?: string }) {
  return (
    <nav aria-label="Process flow progress" className={cn('overflow-x-auto', className)}>
      <ol className="flex min-w-[600px] items-start gap-1">
        {stages.map((stage, index) => {
          const groupStart = index === 0 || stages[index - 1].group !== stage.group
          const fullLabel = stage.group === 'Outcome' ? stage.label : `${stage.group} ${stage.label}`
          return (
            <li
              key={`${stage.group}-${stage.label}`}
              aria-current={stage.state === 'current' ? 'step' : undefined}
              className={cn('flex flex-col gap-1.5',
                stage.group === 'Outcome' ? 'flex-none' : 'min-w-0 flex-1', groupStart && index > 0 && 'ml-2')}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  groupStart ? 'text-muted-foreground' : 'invisible',
                )}
                aria-hidden
              >
                {stage.group === 'Outcome' ? 'Outcome' : stage.group}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                    stage.state === 'done' && 'border-success bg-success text-success-foreground',
                    stage.state === 'current' && 'border-brand bg-brand-muted text-brand',
                    stage.state === 'upcoming' && 'border-border bg-background text-muted-foreground',
                  )}
                  aria-hidden
                >
                  {stage.state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full',
                    index === stages.length - 1 ? 'invisible' : stage.state === 'done' ? 'bg-success' : 'bg-border',
                  )}
                  aria-hidden
                />
              </span>
              <span
                className={cn(
                  'text-xs leading-tight',
                  stage.state === 'current' && 'font-semibold text-brand',
                  stage.state === 'done' && 'text-foreground',
                  stage.state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                <span className="sr-only">
                  {fullLabel}
                  {stage.state === 'done' ? ', done' : stage.state === 'current' ? ', current stage' : ', not started'}
                  {stage.note ? `, ${stage.note}` : ''}
                </span>
                <span aria-hidden>{stage.label}</span>
              </span>
              {stage.note ? (
                <span aria-hidden className="text-[11px] font-medium text-info">
                  {stage.note}
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

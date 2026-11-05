import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDelta, formatDuration } from '@/modules/process-flows/compare-model'
import type { CompareModel } from '@/modules/process-flows/compare-model'
import type { ProcessMetrics } from '@/modules/process-flows/metrics'

interface MetricSpec {
  key: keyof ProcessMetrics
  label: string
  unit?: 'min'
  /** Approvals are neutral: fewer is lighter, but more can be a deliberate control. */
  neutral?: boolean
}

const METRICS: readonly MetricSpec[] = [
  { key: 'steps', label: 'Steps' },
  { key: 'manualSteps', label: 'Manual steps' },
  { key: 'handoffs', label: 'Hand-offs' },
  { key: 'approvals', label: 'Approvals', neutral: true },
  { key: 'workMinutes', label: 'Work time', unit: 'min' },
  { key: 'waitMinutes', label: 'Wait time', unit: 'min' },
]

type Tone = 'better' | 'worse' | 'same'

function toneOf(delta: number, neutral: boolean | undefined): Tone {
  if (delta === 0 || neutral) return 'same'
  return delta < 0 ? 'better' : 'worse'
}

const TONE_CLASS: Record<Tone, string> = {
  better: 'bg-success-muted text-success',
  worse: 'bg-warning-muted text-warning',
  same: 'bg-muted text-muted-foreground',
}

function DeltaChip({ delta, unit, neutral }: { delta: number; unit?: 'min'; neutral?: boolean }) {
  const tone = toneOf(delta, neutral)
  const magnitude = unit === 'min' ? formatDuration(Math.abs(delta)) : String(Math.abs(delta))
  const Icon = delta === 0 ? Minus : delta < 0 ? ArrowDown : ArrowUp
  const word = delta === 0 ? 'No change' : delta < 0 ? 'Down' : 'Up'
  const quality = tone === 'better' ? ', an improvement' : tone === 'worse' ? ', worse' : ''
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', TONE_CLASS[tone])}
    >
      <Icon className="size-3" aria-hidden />
      {delta === 0 ? (
        'No change'
      ) : (
        <>
          <span aria-hidden>{magnitude}</span>
          <span className="sr-only">{`${word} ${magnitude}${quality}`}</span>
        </>
      )}
    </span>
  )
}

/** Headline numbers for the Compare tab: As-Is → To-Be with a delta chip per measure. */
export function GapMetrics({ model }: { model: CompareModel }) {
  const { asIs, toBe, delta } = model.metrics
  const { addressed, total } = model.painPoints
  return (
    <section aria-label="Headline numbers" className="rounded-lg border border-border bg-card p-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((spec) => (
          <li key={spec.key} className="min-w-0 rounded-md border border-border px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">{spec.label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">
              {formatDelta(asIs[spec.key], toBe[spec.key], spec.unit)}
            </p>
            <div className="mt-1">
              <DeltaChip delta={delta[spec.key]} unit={spec.unit} neutral={spec.neutral} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-border pt-3 text-xs font-medium">
        {total === 0 ? (
          <span className="text-muted-foreground">No pain points were recorded in the As-Is.</span>
        ) : (
          <span className={addressed === total ? 'text-success' : undefined}>
            Pain points addressed: {addressed} of {total}
          </span>
        )}
      </p>
    </section>
  )
}

import { AlertTriangle, Pencil, PlusCircle, MinusCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import type { GapKind, GapRow } from '@/modules/process-flows/compare-model'
import type { EntityId } from '@/types/common'

interface GroupStyle {
  heading: string
  Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /** Colour of the icon and heading. */
  tone: string
  /** Row container colour. */
  row: string
}

const GROUPS: Record<GapKind, GroupStyle> = {
  removed: {
    heading: 'Removed',
    Icon: MinusCircle,
    tone: 'text-destructive',
    row: 'border-border hover:bg-muted',
  },
  changed: {
    heading: 'Changed',
    Icon: Pencil,
    tone: 'text-warning',
    row: 'border-border hover:bg-muted',
  },
  added: {
    heading: 'Added',
    Icon: PlusCircle,
    tone: 'text-success',
    row: 'border-border hover:bg-muted',
  },
  'not-addressed': {
    heading: 'Not addressed',
    Icon: AlertTriangle,
    tone: 'text-destructive',
    row: 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10',
  },
}

const ORDER: readonly GapKind[] = ['removed', 'changed', 'added', 'not-addressed']

export interface GapListProps {
  rows: readonly GapRow[]
  onSelect(row: GapRow): void
  /** Pair a removed step with the added step that replaces it. */
  onReplace(removedId: EntityId, addedId: EntityId): void
  /** Whether any pairing is active, to offer clearing it. */
  hasPairs: boolean
  onClearPairs(): void
}

export function GapList({ rows, onSelect, onReplace, hasPairs, onClearPairs }: GapListProps) {
  const added = rows.filter((row) => row.kind === 'added')
  const canPair = added.length > 0 && rows.some((row) => row.kind === 'removed')

  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No differences yet — edit the To-Be to see the gaps.
      </p>
    )
  }

  return (
    <div className="space-y-4 p-3">
      {ORDER.map((kind) => {
        const group = rows.filter((row) => row.kind === kind)
        if (group.length === 0) return null
        const { heading, Icon, tone, row: rowStyle } = GROUPS[kind]
        const headingId = `gap-group-${kind}`
        return (
          <section key={kind} aria-labelledby={headingId}>
            <h4
              id={headingId}
              className={cn(
                'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
                tone,
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {heading}
              <span className="font-medium text-muted-foreground">({group.length})</span>
            </h4>
            <ul className="space-y-1.5">
              {group.map((row) => (
                <li key={row.id} className={cn('rounded-md border', rowStyle)}>
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    aria-label={`${heading}: ${row.title}. ${row.detail}. Show on the diagram.`}
                    className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    <Icon className={cn('mt-0.5 size-4 shrink-0', tone)} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{row.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{row.detail}</span>
                    </span>
                  </button>
                  {kind === 'removed' && added.length > 0 ? (
                    <div className="px-3 pb-2 pl-9">
                      <label className="sr-only" htmlFor={`replace-${row.id}`}>
                        {`${row.title} is replaced by`}
                      </label>
                      <select
                        id={`replace-${row.id}`}
                        value=""
                        onChange={(event) => {
                          if (event.target.value) onReplace(row.elementId, event.target.value)
                        }}
                        className="h-7 max-w-full rounded-md border border-border bg-card px-2 text-xs text-muted-foreground"
                      >
                        <option value="">Replaced by…</option>
                        {added.map((candidate) => (
                          <option key={candidate.id} value={candidate.elementId}>
                            {candidate.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {hasPairs || canPair ? (
        <p className="text-[11px] text-muted-foreground">
          Pairing is for this view only.
          {hasPairs ? (
            <>
              {' '}
              <button type="button" onClick={onClearPairs} className="font-medium underline underline-offset-2">
                Clear pairings
              </button>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

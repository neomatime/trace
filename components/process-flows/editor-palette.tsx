'use client'

import { useId, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { iconSvg } from '@/lib/bpmn/editor/icons'
import { filterPalette, paletteGroup } from '@/lib/bpmn/editor/palette'
import type { PaletteEntry } from '@/lib/bpmn/editor/palette'
import { cn } from '@/lib/utils'

/** Pixels the pointer must travel before a press becomes a drag. */
const DRAG_THRESHOLD = 4

export interface EditorPaletteProps {
  /** Click / Enter: add the element at a free spot in view. */
  onAdd(bpmnType: string): void
  /** Drag: hand the pointer over to the canvas, which follows it until drop. */
  onDragStart(bpmnType: string, event: MouseEvent): void
  className?: string
}

function EntryIcon({ entry }: { entry: PaletteEntry }) {
  // Static, trusted markup from lib/bpmn/editor/icons.ts (no user input).
  return <span className="trace-palette-icon" dangerouslySetInnerHTML={{ __html: iconSvg(entry.icon) }} />
}

function PaletteButton({
  entry,
  onAdd,
  onDragStart,
}: {
  entry: PaletteEntry
  onAdd: EditorPaletteProps['onAdd']
  onDragStart: EditorPaletteProps['onDragStart']
}) {
  const press = useRef<{ x: number; y: number } | null>(null)
  const dragged = useRef(false)

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || event.pointerType !== 'mouse') return
    press.current = { x: event.clientX, y: event.clientY }
    dragged.current = false
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = press.current
    if (!start) return
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD) return
    press.current = null
    dragged.current = true
    onDragStart(entry.bpmnType, event.nativeEvent)
  }

  return (
    <button
      type="button"
      draggable={false}
      data-testid={`palette-${entry.id}`}
      aria-label={`Add ${entry.label} (${entry.bpmnName}). ${entry.hint}`}
      title={`${entry.hint} Click to add, or drag onto the diagram.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        press.current = null
      }}
      onPointerLeave={(event) => {
        // leaving the button with the mouse held down still counts as a drag
        if (press.current && event.buttons === 1) onPointerMove(event)
      }}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        onAdd(entry.bpmnType)
      }}
      className="trace-palette-entry group flex w-full cursor-grab items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <EntryIcon entry={entry} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium text-foreground">{entry.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{entry.bpmnName}</span>
      </span>
    </button>
  )
}

/**
 * Progressive palette: the four basics up front, the rest behind
 * "More elements", and a search over everything by plain or BPMN name.
 */
export function EditorPalette({ onAdd, onDragStart, className }: EditorPaletteProps) {
  const [query, setQuery] = useState('')
  const [showMore, setShowMore] = useState(false)
  const moreId = useId()
  const searchId = useId()
  const searching = query.trim().length > 0
  const results = searching ? filterPalette(query) : []
  const more = paletteGroup('more')

  const list = (entries: readonly PaletteEntry[]) => (
    <ul className="flex flex-col gap-0.5">
      {entries.map((entry) => (
        <li key={entry.id}>
          <PaletteButton entry={entry} onAdd={onAdd} onDragStart={onDragStart} />
        </li>
      ))}
    </ul>
  )

  return (
    <aside
      aria-label="Elements"
      className={cn(
        'trace-palette flex w-56 flex-col gap-2 bg-card p-2',
        className,
      )}
    >
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search elements
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setQuery('')
            if (event.key === 'Enter' && results.length > 0) onAdd(results[0].bpmnType)
          }}
          placeholder="Search elements"
          className="h-8 w-full rounded-lg border border-border bg-background pr-7 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {searching ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {searching ? (
        <section aria-label="Search results" aria-live="polite">
          {results.length ? (
            list(results)
          ) : (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No elements match “{query.trim()}”.</p>
          )}
        </section>
      ) : (
        <>
          <section aria-label="Basics">
            <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Basics</h2>
            {list(paletteGroup('basics'))}
          </section>
          <section className="border-t border-border pt-1.5">
            <button
              type="button"
              aria-expanded={showMore}
              aria-controls={moreId}
              onClick={() => setShowMore((open) => !open)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              More elements
              <ChevronDown className={cn('size-3.5 transition-transform', showMore && 'rotate-180')} aria-hidden />
            </button>
            <div id={moreId} hidden={!showMore} className="pt-1">
              {list(more)}
            </div>
          </section>
        </>
      )}
      <p className="px-2 text-[11px] leading-snug text-muted-foreground">Click to add, or drag onto the diagram.</p>
    </aside>
  )
}

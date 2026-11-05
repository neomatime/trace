'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Maximize2, Redo2, Search, TriangleAlert, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { summarizeIssues } from '@/lib/bpmn/editor/issue-state'
import type { ValidationIssue } from '@/modules/process-flows/validation'
import { cn } from '@/lib/utils'

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export interface ToolbarIssue extends ValidationIssue {
  /** Name of the element the issue is about, when it has one. */
  elementName?: string
}

export interface EditorToolbarProps {
  /** Show undo/redo (hidden in read-only mode). */
  editable: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo(): void
  onRedo(): void
  onZoomIn(): void
  onZoomOut(): void
  onFit(): void
  /** Select the best name match; returns false when nothing matches. */
  onSearch(query: string): boolean
  /** Issues to list, or null when live validation is off. Ordered for display. */
  issues: readonly ToolbarIssue[] | null
  onIssueSelect(issue: ToolbarIssue): void
  className?: string
}

function ToolButton({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  disabled?: boolean
  onClick(): void
  children: ReactNode
}) {
  return (
    <Tooltip content={shortcut ? `${label} (${shortcut})` : label}>
      <button
        type="button"
        aria-label={label}
        aria-keyshortcuts={shortcut}
        disabled={disabled}
        onClick={onClick}
        className="flex size-8 items-center justify-center rounded-lg text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"
      >
        {children}
      </button>
    </Tooltip>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-border" />

function IssuesMenu({ issues, onSelect }: { issues: readonly ToolbarIssue[]; onSelect(issue: ToolbarIssue): void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const { errors, warnings, total } = summarizeIssues(issues)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const summary =
    total === 0
      ? 'No issues'
      : [errors ? `${errors} ${errors === 1 ? 'error' : 'errors'}` : null, warnings ? `${warnings} ${warnings === 1 ? 'warning' : 'warnings'}` : null]
          .filter(Boolean)
          .join(', ')

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        data-testid="issues-button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
          total === 0
            ? 'border-border text-muted-foreground hover:bg-muted'
            : errors
              ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15'
              : 'border-warning/50 bg-warning/15 text-foreground hover:bg-warning/25',
        )}
      >
        {total === 0 ? (
          <CircleCheck className="size-3.5 text-success" aria-hidden />
        ) : errors ? (
          <CircleAlert className="size-3.5" aria-hidden />
        ) : (
          <TriangleAlert className="size-3.5" aria-hidden />
        )}
        <span aria-live="polite">{summary}</span>
      </button>
      {open ? (
        <div
          id={listId}
          role="region"
          aria-label="Diagram issues"
          className="absolute top-full right-0 z-30 mt-1 max-h-80 w-80 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {total === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Nothing to fix. The diagram looks complete.</p>
          ) : (
            <ul className="flex flex-col">
              {issues.map((issue, index) => {
                const icon =
                  issue.severity === 'error' ? (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Error" />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Warning" />
                  )
                const body = (
                  <>
                    {icon}
                    <span className="min-w-0">
                      <span className="block text-sm">{issue.message}</span>
                      {issue.elementId ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {issue.elementName ? issue.elementName : 'Unnamed element'} · click to show
                        </span>
                      ) : null}
                    </span>
                  </>
                )
                return (
                  <li key={`${issue.severity}-${issue.elementId ?? ''}-${index}`}>
                    {issue.elementId ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(issue)
                          setOpen(false)
                        }}
                        className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex items-start gap-2 px-2.5 py-2">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Undo/redo, zoom, fit, find-by-name and the live issue count. */
export function EditorToolbar(props: EditorToolbarProps) {
  const { editable, canUndo, canRedo, issues } = props
  const [query, setQuery] = useState('')
  const [missing, setMissing] = useState(false)
  const searchId = useId()
  const mod = isMac() ? '⌘' : 'Ctrl'

  const search = (value: string) => {
    if (!value.trim()) {
      setMissing(false)
      return
    }
    setMissing(!props.onSearch(value))
  }

  return (
    <div
      role="toolbar"
      aria-label="Diagram tools"
      className={cn('flex flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-1.5', props.className)}
    >
      {editable ? (
        <>
          <ToolButton label="Undo" shortcut={`${mod}+Z`} disabled={!canUndo} onClick={props.onUndo}>
            <Undo2 aria-hidden />
          </ToolButton>
          <ToolButton label="Redo" shortcut={`${mod}+Shift+Z`} disabled={!canRedo} onClick={props.onRedo}>
            <Redo2 aria-hidden />
          </ToolButton>
          <Divider />
        </>
      ) : null}
      <ToolButton label="Zoom out" shortcut={`${mod}+-`} onClick={props.onZoomOut}>
        <ZoomOut aria-hidden />
      </ToolButton>
      <ToolButton label="Zoom in" shortcut={`${mod}++`} onClick={props.onZoomIn}>
        <ZoomIn aria-hidden />
      </ToolButton>
      <ToolButton label="Fit to screen" shortcut={`${mod}+0`} onClick={props.onFit}>
        <Maximize2 aria-hidden />
      </ToolButton>
      <Divider />
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Find a step by name
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          data-testid="diagram-search"
          aria-invalid={missing || undefined}
          aria-describedby={missing ? `${searchId}-missing` : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            search(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') search(query)
            if (event.key === 'Escape') {
              setQuery('')
              setMissing(false)
            }
          }}
          placeholder="Find a step by name"
          className="h-8 w-52 rounded-lg border border-border bg-background pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
        {missing ? (
          <span id={`${searchId}-missing`} role="status" className="ml-2 text-xs text-muted-foreground">
            No step called “{query.trim()}”
          </span>
        ) : null}
      </div>
      {issues ? (
        <div className="ml-auto">
          <IssuesMenu issues={issues} onSelect={props.onIssueSelect} />
        </div>
      ) : null}
    </div>
  )
}

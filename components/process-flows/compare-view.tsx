'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, GitCompareArrows } from 'lucide-react'
import type { CompareState, ProcessEditor } from '@/lib/bpmn/editor'
import { buildCompareXml } from '@/lib/bpmn/compare'
import { parseBpmnXml } from '@/lib/bpmn/graph'
import { buildCompareModel, summarizeGaps } from '@/modules/process-flows/compare-model'
import type { GapRow, Replacement } from '@/modules/process-flows/compare-model'
import type { EntityId } from '@/types/common'
import type { ProcessGraph, ProcessModelVersion } from '@/types/process-flow'
import { BpmnEditor } from './bpmn-editor'
import { GapList } from './gap-list'
import { GapMetrics } from './gap-metrics'

/** The comparison is recomputed this long after the To-Be XML last changed. */
const RECOMPUTE_DELAY_MS = 400

export interface CompareViewProps {
  asIs: ProcessModelVersion
  /** Null until the To-Be has been created. */
  toBe: ProcessModelVersion | null
  canCreateToBe: boolean
  onCreateToBe(): void
}

export function CompareView({ asIs, toBe, canCreateToBe, onCreateToBe }: CompareViewProps) {
  if (!toBe) {
    const approved = asIs.status === 'Approved'
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-muted">
          <GitCompareArrows className="size-5 text-brand" aria-hidden />
        </span>
        <h3 className="mt-4 text-sm font-semibold">
          {approved ? 'Create the To-Be to see the gaps.' : 'Approve the As-Is first.'}
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {approved
            ? 'The To-Be starts as a copy of the approved As-Is. Edit what changes and the gaps appear here.'
            : 'The To-Be is created once HIMARK and the client have both approved the As-Is.'}
        </p>
        {approved && canCreateToBe ? (
          <button
            type="button"
            onClick={onCreateToBe}
            className="mt-4 h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            Create To-Be
          </button>
        ) : null}
      </div>
    )
  }
  // One compare editor per pair of models; XML updates are pushed through its `xml` prop.
  return <CompareBody key={`compare:${asIs.id}:${toBe.id}`} asIsXml={asIs.xml} toBeXml={toBe.xml} />
}

interface ParsedPair {
  asIsXml: string
  toBeXml: string
  asIs: ProcessGraph
  toBe: ProcessGraph
}

interface CanvasView {
  xml: string
  states: Record<EntityId, CompareState>
}

const messageOf = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason))

function CompareBody({ asIsXml, toBeXml }: { asIsXml: string; toBeXml: string }) {
  const [parsed, setParsed] = useState<ParsedPair | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pairs, setPairs] = useState<readonly Replacement[]>([])
  const [view, setView] = useState<CanvasView | null>(null)
  const [editor, setEditor] = useState<ProcessEditor | null>(null)

  // Parse both models. The first parse is immediate; later ones wait for the
  // To-Be XML to settle, and a stale parse is dropped if the XML changed again.
  const hasParsed = parsed !== null
  useEffect(() => {
    let current = true
    const timer = setTimeout(
      () => {
        Promise.all([parseBpmnXml(asIsXml), parseBpmnXml(toBeXml)])
          .then(([a, b]) => {
            if (!current) return
            if (!a.ok) return setError(`The As-Is diagram could not be read: ${a.error}`)
            if (!b.ok) return setError(`The To-Be diagram could not be read: ${b.error}`)
            setError(null)
            setParsed({ asIsXml, toBeXml, asIs: a.graph, toBe: b.graph })
          })
          .catch((reason: unknown) => {
            if (current) setError(`The diagrams could not be compared: ${messageOf(reason)}`)
          })
      },
      hasParsed ? RECOMPUTE_DELAY_MS : 0,
    )
    return () => {
      current = false
      clearTimeout(timer)
    }
    // hasParsed only picks the delay; it must not retrigger a parse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asIsXml, toBeXml])

  const model = useMemo(
    () => (parsed ? buildCompareModel(parsed.asIs, parsed.toBe, pairs) : null),
    [parsed, pairs],
  )

  // Merge the removed steps into the To-Be XML. The canvas receives the XML and
  // its states together, and only re-imports when the XML text actually changes.
  useEffect(() => {
    if (!parsed || !model) return
    let current = true
    buildCompareXml(parsed.asIsXml, parsed.toBeXml, model.removedIds)
      .then((xml) => {
        if (!current) return
        setError(null)
        setView({ xml, states: model.states })
      })
      .catch((reason: unknown) => {
        if (current) setError(`The comparison diagram could not be built: ${messageOf(reason)}`)
      })
    return () => {
      current = false
    }
  }, [parsed, model])

  const onSelectRow = useCallback((row: GapRow) => void editor?.selectElement(row.elementId), [editor])

  const replace = useCallback((removedId: EntityId, addedId: EntityId) => {
    setPairs((prev) => [...prev.filter((p) => p.removedId !== removedId && p.addedId !== addedId), { removedId, addedId }])
  }, [])
  const clearPairs = useCallback(() => setPairs([]), [])

  if (error && !model) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{error}</span>
      </div>
    )
  }

  if (!model) {
    return (
      <p role="status" className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Comparing the As-Is and To-Be…
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error} Showing the last comparison that worked.</span>
        </div>
      ) : null}
      <GapMetrics model={model} />
      <p aria-live="polite" className="text-sm font-medium">
        {summarizeGaps(model.rows)}
      </p>
      <Legend />
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card lg:h-[600px] lg:flex-row">
        <div className="h-[520px] min-w-0 lg:h-auto lg:flex-1">
          {view ? (
            <BpmnEditor xml={view.xml} readOnly compareStates={view.states} editorRef={setEditor} />
          ) : (
            <p role="status" className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preparing the diagram…
            </p>
          )}
        </div>
        <div
          aria-label="Gap list"
          role="region"
          className="max-h-[480px] overflow-y-auto border-t border-border lg:max-h-none lg:w-96 lg:shrink-0 lg:border-l lg:border-t-0"
        >
          <GapList
            rows={model.rows}
            onSelect={onSelectRow}
            onReplace={replace}
            hasPairs={pairs.length > 0}
            onClearPairs={clearPairs}
          />
        </div>
      </div>
    </div>
  )
}

const LEGEND: ReadonlyArray<{ label: string; hint: string; swatch: string }> = [
  { label: 'Removed', hint: 'red, dashed', swatch: 'border-destructive border-dashed opacity-60' },
  { label: 'Added', hint: 'green', swatch: 'border-success' },
  { label: 'Changed', hint: 'amber', swatch: 'border-warning' },
  { label: 'Unchanged', hint: 'grey', swatch: 'border-border' },
]

function Legend() {
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {LEGEND.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={`inline-block h-3.5 w-5 rounded-sm border-2 ${item.swatch}`} />
          <span>
            <span className="font-medium text-foreground">{item.label}</span> ({item.hint})
          </span>
        </li>
      ))}
    </ul>
  )
}

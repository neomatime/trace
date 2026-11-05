'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lightbulb } from 'lucide-react'
import { CrudFormDialog } from '@/components/ui/crud'
import type { CrudField } from '@/components/ui/crud'
import type { ActionResult } from '@/hooks/use-process-flow'
import { parseBpmnXml } from '@/lib/bpmn/graph'
import { orderForImplementation, runRules, toRecommendationDraft } from '@/modules/process-flows/rules'
import {
  canCreateRecommendation as roleCanCreate,
  canDecide as roleCanDecide,
  mergeSuggestions,
  summarise,
} from '@/modules/process-flows/suggestion-state'
import type { SuggestionDecision, SuggestionEdits, SuggestionStore } from '@/modules/process-flows/suggestion-state'
import type { EntityId } from '@/types/common'
import type { EffortLevel, RecommendationPriority } from '@/types/recommendation'
import type { ProcessGraph, ProcessModelVersion, ProcessSuggestion } from '@/types/process-flow'
import type { UserRole } from '@/types/user'
import { SuggestionCard } from './suggestion-card'

/** Suggestions are recomputed this long after the To-Be XML last changed. */
const RECOMPUTE_DELAY_MS = 400

const PRIORITIES: readonly RecommendationPriority[] = ['Critical', 'High', 'Medium', 'Low']
const EFFORTS: readonly EffortLevel[] = ['Low', 'Medium', 'High', 'Very High']

export interface SuggestionsPanelProps {
  flowId: EntityId
  asIs: ProcessModelVersion
  /** Null until the To-Be has been created. */
  toBe: ProcessModelVersion | null
  role: UserRole
  aiDemo: readonly ProcessSuggestion[]
  store: SuggestionStore
  canCreateToBe: boolean
  onCreateToBe(): void
  onDecide(id: EntityId, decision: SuggestionDecision, edits?: SuggestionEdits): ActionResult
  onRecommendationCreated(id: EntityId): void
  onToast(message: string): void
}

export function SuggestionsPanel(props: SuggestionsPanelProps) {
  const { asIs, toBe, canCreateToBe, onCreateToBe } = props
  if (!toBe) {
    const approved = asIs.status === 'Approved'
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-muted">
          <Lightbulb className="size-5 text-brand" aria-hidden />
        </span>
        <h3 className="mt-4 text-sm font-semibold">Create the To-Be to get improvement suggestions.</h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {approved
            ? 'The To-Be starts as a copy of the approved As-Is. Once you shape it, suggestions appear here for you to accept, edit or reject.'
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
  return <SuggestionsBody {...props} toBe={toBe} />
}

interface ParsedPair {
  asIs: ProcessGraph
  toBe: ProcessGraph
}

const messageOf = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason))

function SuggestionsBody({
  flowId,
  asIs,
  toBe,
  role,
  aiDemo,
  store,
  onDecide,
  onRecommendationCreated,
  onToast,
}: SuggestionsPanelProps & { toBe: ProcessModelVersion }) {
  const asIsXml = asIs.xml
  const toBeXml = toBe.xml
  const [parsed, setParsed] = useState<ParsedPair | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<EntityId | null>(null)

  // First parse is immediate; later ones wait for the To-Be XML to settle.
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
            setParsed({ asIs: a.graph, toBe: b.graph })
          })
          .catch((reason: unknown) => {
            if (current) setError(`The diagrams could not be analysed: ${messageOf(reason)}`)
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

  const items = useMemo(
    () => (parsed ? mergeSuggestions(flowId, runRules(parsed.asIs, parsed.toBe), aiDemo, store) : null),
    [parsed, flowId, aiDemo, store],
  )

  const stepNames = useMemo(() => {
    const names = new Map<EntityId, string>()
    for (const element of [...(parsed?.asIs.elements ?? []), ...(parsed?.toBe.elements ?? [])]) {
      if (element.name.trim()) names.set(element.id, element.name)
    }
    return (ids: readonly EntityId[]) => ids.map((id) => names.get(id)).filter((n): n is string => Boolean(n))
  }, [parsed])

  if (error && !items) {
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
  if (!items) {
    return (
      <p role="status" className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Looking for improvements…
      </p>
    )
  }

  const canDecide = roleCanDecide(role)
  const canCreate = roleCanCreate(role)
  const counts = summarise(items)
  const active = orderForImplementation(items.filter((i) => i.status !== 'Rejected'))
  const planned = active.filter((i) => i.status === 'Accepted' || i.status === 'Edited')
  const toReview = active.filter((i) => i.status === 'Proposed')
  const rejected = items.filter((i) => i.status === 'Rejected')
  const editing = editingId ? items.find((i) => i.id === editingId) : undefined

  const createRecommendation = (item: ProcessSuggestion) => {
    try {
      toRecommendationDraft(item)
    } catch (reason) {
      onToast(messageOf(reason))
      return
    }
    onRecommendationCreated(item.id)
    onToast(`Recommendation drafted from ${item.title} (demo)`)
  }

  const card = (item: ProcessSuggestion, step?: number) => (
    <SuggestionCard
      key={item.id}
      suggestion={item}
      step={step}
      stepNames={stepNames(item.elementIds)}
      canDecide={canDecide}
      canCreateRecommendation={canCreate}
      drafted={store.created.includes(item.id)}
      onAccept={() => onDecide(item.id, 'Accepted')}
      onEdit={() => setEditingId(item.id)}
      onReject={() => onDecide(item.id, 'Rejected')}
      onCreateRecommendation={() => createRecommendation(item)}
    />
  )

  const editFields: readonly CrudField[] = editing
    ? [
        { name: 'title', label: 'Title', value: editing.title, required: true },
        { name: 'rationale', label: 'Rationale', value: editing.rationale, type: 'textarea', required: true },
        { name: 'expectedOutcome', label: 'Expected outcome', value: editing.expectedOutcome, type: 'textarea', required: true },
        { name: 'priority', label: 'Priority', value: editing.priority, type: 'select', options: PRIORITIES },
        { name: 'effort', label: 'Effort', value: editing.effort, type: 'select', options: EFFORTS },
      ]
    : []

  return (
    <div className="space-y-5">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error} Showing the last suggestions that worked.</span>
        </div>
      ) : null}

      <div className="space-y-1">
        <p aria-live="polite" className="text-sm font-medium">
          {counts.proposed} to review · {counts.accepted + counts.edited} accepted · {counts.rejected} rejected
        </p>
        {!canDecide ? (
          <p className="text-xs text-muted-foreground">Only HIMARK staff can decide on suggestions.</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Suggestions come from simple process rules and from demo data that stands in for AI. Nothing is accepted
          until a person decides.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No improvement suggestions for this To-Be right now.
        </p>
      ) : null}

      {planned.length > 0 ? (
        <section aria-labelledby="sugg-order">
          <h3 id="sugg-order" className="mb-2 text-sm font-semibold">
            Suggested order of work
          </h3>
          <ol className="space-y-3">{planned.map((item, index) => card(item, index + 1))}</ol>
        </section>
      ) : null}

      {toReview.length > 0 ? (
        <section aria-labelledby="sugg-review">
          <h3 id="sugg-review" className="mb-2 text-sm font-semibold">
            To review
          </h3>
          <ul className="space-y-3">{toReview.map((item) => card(item))}</ul>
        </section>
      ) : null}

      {rejected.length > 0 ? (
        <details className="rounded-lg border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">Rejected ({rejected.length})</summary>
          <ul className="mt-3 space-y-3">{rejected.map((item) => card(item))}</ul>
        </details>
      ) : null}

      <CrudFormDialog
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title="Edit suggestion"
        description="Adjust the wording, priority or effort. Saving records the suggestion as edited."
        fields={editFields}
        submitLabel="Save edit"
        onSubmit={(values) => {
          if (!editing) return
          onDecide(editing.id, 'Edited', {
            title: values.title.trim(),
            rationale: values.rationale.trim(),
            expectedOutcome: values.expectedOutcome.trim(),
            priority: values.priority as RecommendationPriority,
            effort: values.effort as EffortLevel,
          })
        }}
      />
    </div>
  )
}

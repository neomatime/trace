'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, GitCompareArrows, Lightbulb, Workflow, X } from 'lucide-react'
import { CrudEmptyState, CrudToast } from '@/components/ui/crud'
import { PageTabs } from '@/components/ui/tabs'
import { currentProcessFlowUser, mockUserForRole, userName } from '@/data/mock/process-flows'
import type { ProcessFlowUser } from '@/data/mock/process-flows'
import { usePermissions } from '@/hooks/use-permissions'
import { useProcessFlow } from '@/hooks/use-process-flow'
import type { ActionResult, ProcessFlowActions } from '@/hooks/use-process-flow'
import type { ProcessEditor } from '@/lib/bpmn/editor'
import { emptyProcessXml } from '@/lib/bpmn/graph'
import { lockedReason, stageStates } from '@/modules/process-flows/workspace-state'
import type { EntityId } from '@/types/common'
import type { ApprovalParty, ApprovalRecord, ProcessModelVersion } from '@/types/process-flow'
import type { UserRole } from '@/types/user'
import { ApprovalBar } from './approval-bar'
import { BpmnEditor } from './bpmn-editor'
import { ElementPropertiesPanel } from './element-properties-panel'
import { StageStepper } from './stage-stepper'

const TABS = ['As-Is', 'To-Be', 'Compare', 'Improvements'] as const
type Tab = (typeof TABS)[number]

/** Editor changes are saved to the workspace state after this much idle time. */
const SAVE_DELAY_MS = 500

const TO_BE_CREATED = 'To-Be created from the approved As-Is — edit what changes.'

export interface ProcessFlowWorkspaceProps {
  auditId: EntityId
  /**
   * Development-only role override from `?as=<Role>` (the page passes it only
   * when NODE_ENV !== 'production') so reviewers can exercise permission gating.
   */
  devRole?: UserRole | null
}

export function ProcessFlowWorkspace({ auditId, devRole }: ProcessFlowWorkspaceProps) {
  const user: ProcessFlowUser = devRole ? mockUserForRole(devRole) : currentProcessFlowUser
  const { flow, asIs, toBe, approvals, error, ready, actions } = useProcessFlow(auditId, user)
  const { can } = usePermissions(user.role)
  const [tab, setTab] = useState<Tab>('As-Is')
  const [toast, setToast] = useState('')
  const closeToast = useCallback(() => setToast(''), [])

  const onApproved = (result: ActionResult) => {
    if (!result.ok) return
    if (result.createdToBe) {
      setTab('To-Be')
      setToast(TO_BE_CREATED)
    } else {
      setToast('Approval recorded.')
    }
  }

  const startMap = async () => {
    const xml = await emptyProcessXml('Process')
    actions.startProcessMap('Process map', xml)
  }

  const devBadge = devRole ? (
    <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground">
      Viewing as {user.role} (development only)
    </span>
  ) : null

  if (!flow || !asIs) {
    return (
      <section aria-label="Process flow" className="rounded-xl border border-border bg-card">
        {devBadge ? <div className="px-4 pt-4">{devBadge}</div> : null}
        {can('audit:run') ? (
          <CrudEmptyState
            title="No process map yet"
            description="Map how this process works today (the As-Is). Once it is approved, you'll design the improved To-Be."
            actionLabel="Start process map"
            onAction={() => void startMap()}
          />
        ) : (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No process map has been started for this audit yet.
          </p>
        )}
        {error ? <ErrorLine message={error} onDismiss={actions.clearError} /> : null}
        {toast ? <CrudToast message={toast} onClose={closeToast} /> : null}
      </section>
    )
  }

  const needsToBe = asIs.status === 'Approved' && !toBe
  const modelPaneProps = {
    actions,
    approvals,
    canEdit: can('audit:run'),
    canSubmit: can('assessment:submit'),
    canApprove: can('processflow:approve'),
    canRaiseFinding: can('finding:create'),
    canLinkRecommendation: can('recommendation:create'),
    auditId,
    onApproved,
    onToast: setToast,
  }

  return (
    <section aria-label="Process flow" className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Workflow className="size-5 text-brand" aria-hidden />
            {flow.name}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Owner: {userName(flow.createdBy)}</p>
        </div>
        {devBadge}
      </header>

      <div className="rounded-lg border border-border bg-card p-4">
        <StageStepper stages={stageStates({ flow, asIs, toBe, approvals })} />
        <p role="status" className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-medium">
          {ready.ok ? (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          ) : (
            <CircleDashed className="size-4 text-muted-foreground" aria-hidden />
          )}
          <span className={ready.ok ? 'text-success' : 'text-muted-foreground'}>{ready.message}</span>
        </p>
      </div>

      {needsToBe ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-muted px-4 py-3 text-sm"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          <span className="flex-1">The As-Is is approved but has no To-Be yet. Create it to continue.</span>
          {can('audit:run') ? (
            <button
              type="button"
              onClick={() => {
                const result = actions.startToBe(asIs.id)
                if (result.ok) {
                  setTab('To-Be')
                  setToast(TO_BE_CREATED)
                }
              }}
              className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              Create To-Be
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <ErrorLine message={error} onDismiss={actions.clearError} /> : null}

      <PageTabs tabs={[...TABS]} active={tab} onChange={(next) => setTab(next as Tab)} />

      <div role="tabpanel" aria-label={tab}>
        {tab === 'As-Is' ? <ModelPane key={asIs.id} model={asIs} {...modelPaneProps} /> : null}
        {tab === 'To-Be' ? (
          toBe ? (
            <ModelPane key={toBe.id} model={toBe} {...modelPaneProps} />
          ) : (
            <Placeholder
              icon={<CircleDashed className="size-5 text-brand" aria-hidden />}
              title="No To-Be yet"
              text="The To-Be is created from the As-Is once HIMARK and the client have both approved it."
            />
          )
        ) : null}
        {tab === 'Compare' ? (
          <Placeholder
            icon={<GitCompareArrows className="size-5 text-brand" aria-hidden />}
            title="Gap view — coming next"
            text="Compare the As-Is and To-Be side by side: what was removed, changed and added, and which pain points are still open."
          />
        ) : null}
        {tab === 'Improvements' ? (
          <Placeholder
            icon={<Lightbulb className="size-5 text-brand" aria-hidden />}
            title="Improvement suggestions — coming next"
            text="Suggested improvements for this process will appear here for you to accept, edit or reject."
          />
        ) : null}
      </div>

      {toast ? <CrudToast message={toast} onClose={closeToast} /> : null}
    </section>
  )
}

function ErrorLine({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="rounded p-0.5 hover:bg-destructive/10">
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

function Placeholder({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-muted">{icon}</span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{text}</p>
    </div>
  )
}

interface ModelPaneProps {
  model: ProcessModelVersion
  approvals: readonly ApprovalRecord[]
  actions: ProcessFlowActions
  canEdit: boolean
  canSubmit: boolean
  canApprove: boolean
  canRaiseFinding: boolean
  canLinkRecommendation: boolean
  auditId: EntityId
  onApproved(result: ActionResult): void
  onToast(message: string): void
}

/**
 * One model (As-Is or To-Be) with its own editor instance. The parent keys this
 * by model id, so the two models never share an editor and the properties
 * panel's editor-identity key changes between them.
 */
function ModelPane({
  model,
  approvals,
  actions,
  canEdit,
  canSubmit,
  canApprove,
  canRaiseFinding,
  canLinkRecommendation,
  auditId,
  onApproved,
  onToast,
}: ModelPaneProps) {
  const [editor, setEditor] = useState<ProcessEditor | null>(null)
  const [selected, setSelected] = useState<EntityId | null>(null)
  // The XML handed to the editor changes only when the status does (and with
  // it the editing mode). Saves while typing never push XML back into the
  // canvas, so editing never re-imports, races an import or drops selection.
  const [shown, setShown] = useState({ status: model.status, xml: model.xml })
  if (shown.status !== model.status) {
    setShown({ status: model.status, xml: model.xml })
    setSelected(null)
  }

  const editable = model.status === 'Draft' && canEdit
  const locked = lockedReason(model.status) ?? (canEdit ? undefined : "Read only — your role can't edit process maps.")

  // Debounced save of the editor's latest XML.
  const pending = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const modelId = model.id
  const { saveDraft } = actions
  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const xml = pending.current
    pending.current = null
    if (xml !== null) saveDraft(modelId, xml)
  }, [saveDraft, modelId])
  // Unsaved edits are saved when the pane closes (tab switch), not lost.
  useEffect(() => flush, [flush])

  const onXmlChange = (xml: string) => {
    if (!editable) return
    pending.current = xml
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_DELAY_MS)
  }

  const stepName = (id: EntityId) => editor?.getElementInfo(id)?.name || 'this step'

  return (
    <div className="space-y-3">
      <ApprovalBar
        model={model}
        approvals={approvals.filter((entry) => entry.modelVersionId === model.id)}
        canSubmit={canSubmit}
        canApprove={canApprove}
        userName={userName}
        onSubmit={async () => {
          flush()
          const result = await actions.submit(model.id)
          if (result.ok) onToast(`${model.kind} submitted for review.`)
          return result
        }}
        onApprove={(party: ApprovalParty, note?: string) => {
          const result = actions.approve(model.id, party, note)
          onApproved(result)
          return result
        }}
        onReject={(party: ApprovalParty, note: string) => {
          const result = actions.reject(model.id, party, note)
          if (result.ok) onToast(`Changes requested. The ${model.kind} is back in draft.`)
          return result
        }}
      />
      <div className="flex h-[600px] min-h-0 overflow-hidden rounded-lg border border-border bg-card">
        <div className="min-w-0 flex-1">
          <BpmnEditor
            xml={shown.xml}
            readOnly={!editable}
            editorRef={setEditor}
            onSelect={setSelected}
            onXmlChange={onXmlChange}
          />
        </div>
        <div className="w-80 shrink-0 border-l border-border">
          <ElementPropertiesPanel
            editor={editor}
            selectedId={selected}
            readOnly={!editable}
            lockedReason={locked}
            actionsWhenReadOnly
            evidenceHref={`/audits/${auditId}/evidence`}
            onRaiseFinding={
              canRaiseFinding ? (id) => onToast(`Finding raised from ${stepName(id)} (demo)`) : undefined
            }
            onLinkRecommendation={
              canLinkRecommendation ? (id) => onToast(`Recommendation linked to ${stepName(id)} (demo)`) : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}

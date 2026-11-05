'use client'

import { useId, useState } from 'react'
import { CheckCircle2, Lock, MessageSquareWarning, Send } from 'lucide-react'
import { ConfirmActionDialog, CrudFormDialog } from '@/components/ui/crud'
import { StatusBadge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { approveBlocker, partyForStatus } from '@/modules/process-flows/workspace-state'
import type { ActionResult } from '@/hooks/use-process-flow'
import type { EntityId } from '@/types/common'
import type { ApprovalParty, ApprovalRecord, ProcessModelStatus, ProcessModelVersion } from '@/types/process-flow'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<ProcessModelStatus, string> = {
  Draft: 'bg-muted text-muted-foreground',
  'In Review': 'bg-warning-muted text-warning',
  'Awaiting Client': 'bg-info-muted text-info',
  Approved: 'bg-success-muted text-success',
}

const PARTY_LABEL: Record<ApprovalParty, string> = { HIMARK: 'HIMARK', Client: 'the client' }

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export interface ApprovalBarProps {
  model: ProcessModelVersion
  /** This model's approval history, oldest first. */
  approvals: readonly ApprovalRecord[]
  /** `assessment:submit` */
  canSubmit: boolean
  /** `processflow:approve`: without it no Approve or Request changes control is rendered. */
  canApprove: boolean
  onSubmit(): Promise<ActionResult>
  onApprove(party: ApprovalParty, note?: string): ActionResult
  onReject(party: ApprovalParty, note: string): ActionResult
  userName(id: EntityId): string
}

const buttonBase =
  'inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
const primary = `${buttonBase} bg-primary text-primary-foreground hover:bg-primary/90`
const secondary = `${buttonBase} border border-border bg-background hover:bg-muted`
const unavailable = 'cursor-not-allowed opacity-50 hover:bg-transparent'

export function ApprovalBar({
  model,
  approvals,
  canSubmit,
  canApprove,
  onSubmit,
  onApprove,
  onReject,
  userName,
}: ApprovalBarProps) {
  const noteId = useId()
  const [approving, setApproving] = useState<ApprovalParty | null>(null)
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reviewParty = partyForStatus(model.status)
  const label = `${model.kind} · version ${model.version}`

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  const openApprove = (party: ApprovalParty) => {
    if (approveBlocker(model.status, party)) return
    setNote('')
    setApproving(party)
  }

  const approveButton = (party: ApprovalParty) => {
    const blocker = approveBlocker(model.status, party)
    const text = `Approve — ${party}`
    const button = (
      <button
        type="button"
        aria-disabled={blocker ? true : undefined}
        onClick={() => openApprove(party)}
        className={cn(blocker ? secondary : primary, blocker && unavailable)}
      >
        <CheckCircle2 className="size-4" aria-hidden />
        {text}
      </button>
    )
    return blocker ? (
      <Tooltip key={party} content={blocker}>
        {button}
      </Tooltip>
    ) : (
      <span key={party}>{button}</span>
    )
  }

  return (
    <section aria-label={`${model.kind} approval`} className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge status={model.status} className={STATUS_STYLE[model.status]} />
          <span className="text-xs text-muted-foreground">{label}</span>
          {model.status === 'Approved' ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden /> Locked
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {model.status === 'Draft' && canSubmit ? (
            <button type="button" onClick={() => void submit()} disabled={submitting} className={cn(primary, 'disabled:opacity-60')}>
              <Send className="size-4" aria-hidden />
              {submitting ? 'Checking…' : 'Submit for review'}
            </button>
          ) : null}
          {canApprove && reviewParty ? (
            <button type="button" onClick={() => setRejecting(true)} className={secondary}>
              <MessageSquareWarning className="size-4" aria-hidden />
              Request changes
            </button>
          ) : null}
          {canApprove && model.status !== 'Approved' ? (
            <>
              {approveButton('HIMARK')}
              {approveButton('Client')}
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border px-3 py-2.5">
        <h3 className="text-xs font-semibold text-foreground">Approval history</h3>
        {approvals.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">No approvals recorded yet.</p>
        ) : (
          <ol className="mt-1.5 space-y-1.5">
            {approvals.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[11px] font-semibold',
                    entry.decision === 'Approved' ? 'bg-success-muted text-success' : 'bg-warning-muted text-warning',
                  )}
                >
                  {entry.decision === 'Approved' ? 'Approved' : 'Changes requested'}
                </span>
                <span className="font-medium text-foreground">{entry.party}</span>
                <span className="text-muted-foreground">
                  recorded by {userName(entry.byUserId)} · {formatWhen(entry.at)}
                </span>
                {entry.note ? <span className="w-full text-muted-foreground">“{entry.note}”</span> : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      <ConfirmActionDialog
        open={approving !== null}
        onClose={() => setApproving(null)}
        onConfirm={() => {
          if (approving) onApprove(approving, note)
          setApproving(null)
        }}
        title={approving === 'Client' ? 'Record client approval?' : 'Record HIMARK approval?'}
        description={
          approving === 'Client'
            ? `This records that the client approved the ${model.kind}. It will be locked${
                model.kind === 'As-Is' ? ' and the To-Be will be created from it' : ''
              }.`
            : `This records that HIMARK approved the ${model.kind}. The client approves next.`
        }
        confirmLabel="Record approval"
      >
        <label htmlFor={noteId} className="text-xs font-semibold">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={noteId}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. approved on the call, 12 Nov"
          className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-brand"
        />
      </ConfirmActionDialog>

      <CrudFormDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Request changes"
        description={
          reviewParty
            ? `Record what ${PARTY_LABEL[reviewParty]} wants changed. The ${model.kind} goes back to draft so it can be edited.`
            : undefined
        }
        fields={[{ name: 'note', label: 'What needs to change?', value: '', type: 'textarea', required: true }]}
        submitLabel="Request changes"
        onSubmit={(values) => {
          if (reviewParty) onReject(reviewParty, values.note ?? '')
        }}
      />
    </section>
  )
}

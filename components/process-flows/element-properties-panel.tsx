'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { ElementInfo, ProcessEditor } from '@/lib/bpmn/editor'
import { normalizeElementName } from '@/lib/bpmn/editor/label-name'
import { paletteEntryFor } from '@/lib/bpmn/editor/palette'
import type { EntityId } from '@/types/common'
import type { AuditFields } from '@/types/process-flow'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  auditFieldsEqual,
  setApprovalRequired,
  setMinutesField,
  setTextField,
  type MinutesFieldKey,
  type TextFieldKey,
} from './audit-field-form'
import { identityKey } from './editor-identity'

/**
 * Typing is committed to the editor after this much idle time and on blur.
 * Each commit is ONE undo step covering every field edited since the last
 * commit, so an undo reverts a burst of typing, not a single keystroke, and
 * never leaves a half-typed word behind. The toggle commits immediately.
 */
const IDLE_MS = 300

type DraftKey = TextFieldKey | MinutesFieldKey
type Drafts = Record<DraftKey, string>
type Errors = Partial<Record<MinutesFieldKey, string>>

const MINUTES_KEYS: readonly DraftKey[] = ['workMinutes', 'waitMinutes']
const isMinutesKey = (key: DraftKey): key is MinutesFieldKey => MINUTES_KEYS.includes(key)

function draftsFrom(fields: AuditFields): Drafts {
  return {
    owner: fields.owner ?? '',
    system: fields.system ?? '',
    input: fields.input ?? '',
    output: fields.output ?? '',
    control: fields.control ?? '',
    painPoint: fields.painPoint ?? '',
    workMinutes: fields.workMinutes === undefined ? '' : String(fields.workMinutes),
    waitMinutes: fields.waitMinutes === undefined ? '' : String(fields.waitMinutes),
  }
}

function typeLabel(bpmnType: string): string {
  const entry = paletteEntryFor(bpmnType)
  if (!entry) return bpmnType.replace(/^bpmn:/, '')
  return entry.label.toLowerCase() === entry.bpmnName.toLowerCase()
    ? entry.label
    : `${entry.label} (${entry.bpmnName.toLowerCase()})`
}

const NAME_PLACEHOLDERS: Readonly<Record<string, string>> = {
  'bpmn:SequenceFlow': 'Label this flow (e.g. Yes)',
  'bpmn:MessageFlow': 'Label this flow (e.g. Yes)',
  'bpmn:Participant': 'Name this process or participant',
  'bpmn:Lane': 'Name this lane',
}

const namePlaceholder = (bpmnType: string) => NAME_PLACEHOLDERS[bpmnType] ?? 'Name this step'

function read(editor: ProcessEditor, id: EntityId): { fields: AuditFields; info: ElementInfo } | null {
  try {
    const info = editor.getElementInfo(id)
    return info ? { fields: editor.getAuditFields(id), info } : null
  } catch {
    return null // element removed or editor not ready
  }
}

export interface ElementPropertiesPanelProps {
  editor: ProcessEditor | null
  selectedId: EntityId | null
  readOnly: boolean
  onRaiseFinding?: (elementId: EntityId) => void
  onLinkRecommendation?: (elementId: EntityId) => void
  /** Where the Evidence count links to (the audit's Evidence tab). Plain text when absent. */
  evidenceHref?: string
  /** Shown as a small note while read-only, e.g. "approved versions can't be edited". */
  lockedReason?: string
  /**
   * Keep "Raise finding" / "Link recommendation" enabled while read-only (default false),
   * e.g. to raise a finding from an approved, locked version.
   */
  actionsWhenReadOnly?: boolean
}

export function ElementPropertiesPanel(props: ElementPropertiesPanelProps) {
  const { editor, selectedId } = props
  return (
    <aside aria-label="Step details" className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-card text-sm">
      {editor && selectedId ? (
        // Keyed by editor AND element: ids repeat across editors (As-Is / To-Be), so a swapped
        // editor must remount the body too, and drafts never leak between steps or diagrams.
        <PanelBody key={`${identityKey(editor)}:${selectedId}`} {...props} editor={editor} selectedId={selectedId} />
      ) : (
        <EmptyState />
      )}
    </aside>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
      Select a step to see its details.
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PanelBody({
  editor,
  selectedId,
  readOnly,
  onRaiseFinding,
  onLinkRecommendation,
  evidenceHref,
  lockedReason,
  actionsWhenReadOnly = false,
}: ElementPropertiesPanelProps & { editor: ProcessEditor; selectedId: EntityId }) {
  const baseId = useId()
  const [initial] = useState(() => read(editor, selectedId))
  const [info, setInfo] = useState(initial?.info ?? null)
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFrom(initial?.fields ?? { evidenceIds: [] }))
  const [approval, setApproval] = useState(initial?.fields.approvalRequired ?? false)
  const [evidenceCount, setEvidenceCount] = useState(initial?.fields.evidenceIds.length ?? 0)
  const [errors, setErrors] = useState<Errors>({})
  const [nameDraft, setNameDraft] = useState(initial?.info.name ?? '')

  /** The element name the editor holds (set BEFORE writing, like `committed`). */
  const committedName = useRef(initial?.info.name ?? '')
  const nameRef = useRef(nameDraft)
  const nameDirty = useRef(false)
  /** What the editor holds (set BEFORE writing so our own change event is recognised as ours). */
  const committed = useRef<AuditFields>(initial?.fields ?? { evidenceIds: [] })
  const draftsRef = useRef(drafts)
  const dirty = useRef(new Set<DraftKey>())
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const write = useCallback(
    (next: AuditFields) => {
      if (next === committed.current) return
      const previous = committed.current
      committed.current = next
      try {
        editor.setAuditFields(selectedId, next)
      } catch (reason) {
        committed.current = previous
        console.error('[properties-panel] could not save the change', reason)
      }
    },
    [editor, selectedId],
  )

  /** Commit every dirty field as one edit. Invalid minutes are skipped, never written. */
  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (nameDirty.current) {
      nameDirty.current = false
      const wanted = normalizeElementName(nameRef.current) ?? ''
      if (wanted !== committedName.current) {
        const previous = committedName.current
        committedName.current = wanted
        try {
          if (!editor.renameElement(selectedId, nameRef.current)) committedName.current = previous
        } catch (reason) {
          committedName.current = previous
          console.error('[properties-panel] could not rename', reason)
        }
      }
    }
    let next = committed.current
    for (const key of dirty.current) {
      const text = draftsRef.current[key]
      if (isMinutesKey(key)) {
        const result = setMinutesField(next, key, text)
        if (!result.error) next = result.fields
      } else {
        next = setTextField(next, key, text)
      }
    }
    dirty.current.clear()
    write(next)
  }, [write, editor, selectedId])

  // Anything still pending when the selection changes or the panel closes is saved, not lost.
  useEffect(() => flush, [flush])

  // Undo/redo and other outside changes: adopt them, but leave typing alone when the change is ours.
  useEffect(() => {
    return editor.onChange(() => {
      const latest = read(editor, selectedId)
      if (!latest) return
      setInfo(latest.info)
      // A name change that is not ours (canvas rename, undo, redo) replaces the draft;
      // the echo of our own write matches `committedName` and leaves typing alone.
      if (latest.info.name !== committedName.current) {
        committedName.current = latest.info.name
        nameRef.current = latest.info.name
        nameDirty.current = false
        setNameDraft(latest.info.name)
      }
      setEvidenceCount(latest.fields.evidenceIds.length)
      if (auditFieldsEqual(latest.fields, committed.current)) return
      clearTimeout(timer.current)
      dirty.current.clear()
      committed.current = latest.fields
      draftsRef.current = draftsFrom(latest.fields)
      setDrafts(draftsRef.current)
      setApproval(latest.fields.approvalRequired ?? false)
      setErrors({})
    })
  }, [editor, selectedId])

  const edit = (key: DraftKey, text: string) => {
    draftsRef.current = { ...draftsRef.current, [key]: text }
    setDrafts(draftsRef.current)
    dirty.current.add(key)
    if (isMinutesKey(key)) {
      const { error } = setMinutesField(committed.current, key, text)
      setErrors((prev) => ({ ...prev, [key]: error }))
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, IDLE_MS)
  }

  /** Commit now; show the saved (trimmed / normalised) value unless the field is invalid. */
  const blur = (key: DraftKey) => {
    flush()
    if (isMinutesKey(key) && errors[key]) return
    const canonical = draftsFrom(committed.current)[key]
    if (draftsRef.current[key] !== canonical) {
      draftsRef.current = { ...draftsRef.current, [key]: canonical }
      setDrafts(draftsRef.current)
    }
  }

  const editName = (text: string) => {
    nameRef.current = text
    setNameDraft(text)
    nameDirty.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, IDLE_MS)
  }

  /** Commit now and show the saved (trimmed / collapsed) name. */
  const blurName = () => {
    flush()
    if (nameRef.current !== committedName.current) {
      nameRef.current = committedName.current
      setNameDraft(committedName.current)
    }
  }

  const toggleApproval = (checked: boolean) => {
    flush()
    setApproval(checked)
    write(setApprovalRequired(committed.current, checked))
  }

  const fieldId = (key: string) => `${baseId}-${key}`
  const describe = (key: string, hasHint: boolean, error?: string) =>
    error ? `${fieldId(key)}-error` : hasHint ? `${fieldId(key)}-hint` : undefined

  const lock = { disabled: readOnly, 'aria-disabled': readOnly || undefined } as const
  const actionLock = actionsWhenReadOnly ? {} : lock
  const text = (key: TextFieldKey, label: string, hint?: string) => (
    <Field id={fieldId(key)} label={label} hint={hint}>
      <Input
        id={fieldId(key)}
        value={drafts[key]}
        onChange={(event) => edit(key, event.target.value)}
        onBlur={() => blur(key)}
        aria-describedby={describe(key, !!hint)}
        {...lock}
      />
    </Field>
  )
  const minutes = (key: MinutesFieldKey, label: string) => (
    <Field id={fieldId(key)} label={label} error={errors[key]}>
      <Input
        id={fieldId(key)}
        inputMode="numeric"
        autoComplete="off"
        value={drafts[key]}
        onChange={(event) => edit(key, event.target.value)}
        onBlur={() => blur(key)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describe(key, false, errors[key])}
        {...lock}
      />
    </Field>
  )

  if (!info) return <EmptyState />

  const painSet = drafts.painPoint.trim() !== ''
  return (
    <>
      <header className="border-b border-border p-4">
        <h2 className="break-words text-sm font-semibold text-foreground">{info.name || 'Unnamed step'}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{typeLabel(info.bpmnType)}</p>
        {readOnly && lockedReason ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
            <span>{lockedReason}</span>
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-4 p-4">
        <Field id={fieldId('name')} label="Name">
          <Input
            id={fieldId('name')}
            value={nameDraft}
            onChange={(event) => editName(event.target.value)}
            onBlur={blurName}
            placeholder={namePlaceholder(info.bpmnType)}
            autoComplete="off"
            {...lock}
          />
        </Field>
        {text('owner', 'Owner', info.laneName ? `Lane: ${info.laneName}` : undefined)}
        {text('system', 'System')}
        {text('input', 'Input')}
        {text('output', 'Output')}
        <div className="grid grid-cols-2 gap-3">
          {minutes('workMinutes', 'Work time (minutes)')}
          {minutes('waitMinutes', 'Wait time (minutes)')}
        </div>

        <label
          htmlFor={fieldId('approval')}
          className={cn('flex items-center gap-2 text-sm', readOnly && 'opacity-50')}
        >
          <input
            id={fieldId('approval')}
            type="checkbox"
            role="switch"
            checked={approval}
            onChange={(event) => toggleApproval(event.target.checked)}
            className="size-4 accent-brand"
            {...lock}
          />
          Approval required
        </label>

        {text('control', 'Control')}

        <Field id={fieldId('painPoint')} label="Pain point">
          <Textarea
            id={fieldId('painPoint')}
            value={drafts.painPoint}
            onChange={(event) => edit('painPoint', event.target.value)}
            onBlur={() => blur('painPoint')}
            className={cn(painSet && 'border-destructive/40 bg-destructive/5')}
            {...lock}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Evidence</span>
          <p className="text-sm text-muted-foreground">
            {evidenceHref ? (
              <Link href={evidenceHref} className="font-medium text-foreground underline underline-offset-2">
                {evidenceCount} linked
              </Link>
            ) : (
              <span>{evidenceCount} linked</span>
            )}
          </p>
        </div>

        {onRaiseFinding || onLinkRecommendation ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {onRaiseFinding ? (
              <button
                type="button"
                onClick={() => {
                  flush()
                  onRaiseFinding(selectedId)
                }}
                className={actionButton}
                {...actionLock}
              >
                Raise finding
              </button>
            ) : null}
            {onLinkRecommendation ? (
              <button
                type="button"
                onClick={() => {
                  flush()
                  onLinkRecommendation(selectedId)
                }}
                className={actionButton}
                {...actionLock}
              >
                Link recommendation
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}

const actionButton =
  'rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'

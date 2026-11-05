'use client'

// Browser-only implementation behind <BpmnEditor>. Never import this file
// directly from a page: use `BpmnEditor` from './bpmn-editor', which loads it
// with next/dynamic and `ssr: false`.
// External package CSS imported in a component, per
// node_modules/next/dist/docs/01-app/01-getting-started/11-css.md ("External stylesheets").
import 'diagram-js/assets/diagram-js.css'
import './bpmn-editor.css'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { createProcessEditor } from '@/lib/bpmn/editor'
import type { CompareState, ProcessEditor } from '@/lib/bpmn/editor'
import type { ValidationIssue } from '@/modules/process-flows/validation'
import type { EntityId } from '@/types/common'
import { cn } from '@/lib/utils'

export interface BpmnEditorProps {
  xml: string
  readOnly: boolean
  onXmlChange?(xml: string): void
  onSelect?(id: EntityId | null): void
  compareStates?: Record<EntityId, CompareState>
  issues?: ValidationIssue[]
  editorRef?: Ref<ProcessEditor>
  className?: string
}

const NO_STATES: Record<EntityId, CompareState> = {}
const NO_ISSUES: ValidationIssue[] = []

export default function BpmnEditorCanvas({
  xml,
  readOnly,
  onXmlChange,
  onSelect,
  compareStates = NO_STATES,
  issues = NO_ISSUES,
  editorRef,
  className,
}: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useRef<ProcessEditor | null>(null)
  /** XML the canvas currently reflects (imported or emitted), to avoid re-import loops. */
  const shownXml = useRef<string | null>(null)
  const latest = useRef({ xml, onXmlChange, onSelect, compareStates, issues })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    latest.current = { xml, onXmlChange, onSelect, compareStates, issues }
  })

  const load = (editor: ProcessEditor, next: string) => {
    shownXml.current = next
    editor
      .importXml(next)
      .then(() => {
        if (instance.current !== editor) return
        setError(null)
        editor.setCompareStates(latest.current.compareStates)
        editor.setIssues(latest.current.issues)
      })
      .catch((reason: unknown) => {
        if (instance.current !== editor) return
        setError(reason instanceof Error ? reason.message : 'The diagram could not be opened')
      })
  }

  // Create (and on readOnly change, re-create) the diagram-js editor.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const editor = createProcessEditor(container, { readOnly })
    instance.current = editor
    const offSelection = editor.onSelection((id) => latest.current.onSelect?.(id))
    const offChange = editor.onChange(() => {
      editor
        .exportXml()
        .then((out) => {
          if (instance.current !== editor) return
          shownXml.current = out
          latest.current.onXmlChange?.(out)
        })
        .catch((reason: unknown) => console.error('[bpmn-editor] export failed', reason))
    })
    load(editor, latest.current.xml)
    return () => {
      offSelection()
      offChange()
      instance.current = null
      shownXml.current = null
      editor.destroy()
    }
  }, [readOnly])

  // Re-import when the parent passes XML the canvas is not already showing.
  useEffect(() => {
    const editor = instance.current
    if (editor && xml !== shownXml.current) load(editor, xml)
  }, [xml])

  useEffect(() => {
    instance.current?.setCompareStates(compareStates)
  }, [compareStates])

  useEffect(() => {
    instance.current?.setIssues(issues)
  }, [issues])

  // Stable handle that always talks to the live editor instance.
  useImperativeHandle(
    editorRef,
    (): ProcessEditor => {
      const live = () => {
        const editor = instance.current
        if (!editor) throw new Error('The diagram editor is not ready')
        return editor
      }
      return {
        importXml: (next) => live().importXml(next),
        exportXml: () => live().exportXml(),
        onSelection: (cb) => live().onSelection(cb),
        onChange: (cb) => live().onChange(cb),
        getAuditFields: (id) => live().getAuditFields(id),
        setAuditFields: (id, fields) => live().setAuditFields(id, fields),
        setCompareStates: (states) => instance.current?.setCompareStates(states),
        setIssues: (list) => instance.current?.setIssues(list),
        fit: () => instance.current?.fit(),
        undo: () => instance.current?.undo(),
        redo: () => instance.current?.redo(),
        zoomBy: (delta) => instance.current?.zoomBy(delta),
        destroy: () => instance.current?.destroy(),
      }
    },
    [],
  )

  return (
    <div className={cn('trace-bpmn-editor relative h-full min-h-[420px] w-full overflow-hidden', className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {error ? (
        <div
          role="alert"
          className="absolute inset-x-4 top-4 rounded-md border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive shadow-sm"
        >
          {error}
        </div>
      ) : null}
    </div>
  )
}

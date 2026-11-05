'use client'

// Browser-only implementation behind <BpmnEditor>. Never import this file
// directly from a page: use `BpmnEditor` from './bpmn-editor', which loads it
// with next/dynamic and `ssr: false`.
// External package CSS imported in a component, per
// node_modules/next/dist/docs/01-app/01-getting-started/11-css.md ("External stylesheets").
import 'diagram-js/assets/diagram-js.css'
import './bpmn-editor.css'

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, Ref } from 'react'
import { createProcessEditor, traceContextPadModule } from '@/lib/bpmn/editor'
import type { CompareState, EditorModule, ProcessEditor } from '@/lib/bpmn/editor'
import { createLiveValidator, orderIssues, sameIssues } from '@/lib/bpmn/editor/issue-state'
import type { LiveValidator } from '@/lib/bpmn/editor/issue-state'
import { parseBpmnXml } from '@/lib/bpmn/graph'
import { validateGraph } from '@/modules/process-flows/validation'
import type { ValidationIssue } from '@/modules/process-flows/validation'
import type { EntityId } from '@/types/common'
import { cn } from '@/lib/utils'
import { EditorPalette } from './editor-palette'
import { EditorToolbar } from './editor-toolbar'
import type { ToolbarIssue } from './editor-toolbar'

export interface BpmnEditorProps {
  xml: string
  readOnly: boolean
  onXmlChange?(xml: string): void
  onSelect?(id: EntityId | null): void
  compareStates?: Record<EntityId, CompareState>
  /**
   * Issues to badge on the canvas. Ignored while `liveValidation` is on, since
   * the editor then computes them itself.
   */
  issues?: ValidationIssue[]
  editorRef?: Ref<ProcessEditor>
  className?: string
  /** Toolbar above the canvas (default on). Read-only shows zoom, fit and search only. */
  toolbar?: boolean
  /** Element palette (default: on when editable; never in read-only). */
  palette?: boolean
  /** Context pad quick-add on the selected element (default: on when editable; never in read-only). */
  quickAdd?: boolean
  /** Re-check the diagram 400 ms after each change (default: on when editable). */
  liveValidation?: boolean
  /** Latest live-validation issues, after each check that changed them. */
  onIssuesChange?(issues: ValidationIssue[]): void
}

interface LiveResult {
  issues: ValidationIssue[]
  names: Record<string, string>
}

const NO_STATES: Record<EntityId, CompareState> = {}
const NO_ISSUES: ValidationIssue[] = []
const VALIDATION_DELAY_MS = 400

const sameNames = (a: Record<string, string>, b: Record<string, string>) => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

async function checkDiagram(xml: string): Promise<LiveResult | null> {
  const parsed = await parseBpmnXml(xml)
  if (!parsed.ok) {
    console.warn(`[bpmn-editor] could not check the diagram: ${parsed.error}`)
    return null // keep showing the previous issues
  }
  const names: Record<string, string> = {}
  for (const element of parsed.graph.elements) if (element.name) names[element.id] = element.name
  return { issues: validateGraph(parsed.graph), names }
}

const isTextInput = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export default function BpmnEditorCanvas({
  xml,
  readOnly,
  onXmlChange,
  onSelect,
  compareStates = NO_STATES,
  issues = NO_ISSUES,
  editorRef,
  className,
  toolbar = true,
  palette,
  quickAdd,
  liveValidation,
  onIssuesChange,
}: BpmnEditorProps) {
  const showPalette = !readOnly && (palette ?? true)
  const withQuickAdd = !readOnly && (quickAdd ?? true)
  const validateLive = liveValidation ?? !readOnly

  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useRef<ProcessEditor | null>(null)
  const validator = useRef<LiveValidator<string> | null>(null)
  /** XML the canvas currently reflects (imported or emitted), to avoid re-import loops. */
  const shownXml = useRef<string | null>(null)
  const latest = useRef({ xml, onXmlChange, onSelect, compareStates, issues, onIssuesChange, validateLive })
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState({ canUndo: false, canRedo: false })
  const [live, setLive] = useState<LiveResult | null>(null)

  useEffect(() => {
    latest.current = { xml, onXmlChange, onSelect, compareStates, issues, onIssuesChange, validateLive }
  })

  const refreshHistory = (editor: ProcessEditor) => {
    const next = { canUndo: editor.canUndo(), canRedo: editor.canRedo() }
    setHistory((prev) => (prev.canUndo === next.canUndo && prev.canRedo === next.canRedo ? prev : next))
  }

  /**
   * Import, then restore everything an import clears: history state, compare
   * markers and issue badges. Used by prop-driven loads and by the handle's
   * `importXml`, so both re-validate.
   */
  const importInto = async (editor: ProcessEditor, next: string) => {
    await editor.importXml(next)
    if (instance.current !== editor) return
    refreshHistory(editor)
    editor.setCompareStates(latest.current.compareStates)
    const live = validator.current
    if (live) {
      // the import dropped every badge: re-apply even an unchanged issue set
      live.reset()
      live.notify(next)
      await live.flush()
    } else {
      editor.setIssues(latest.current.issues)
    }
  }

  const load = (editor: ProcessEditor, next: string) => {
    shownXml.current = next
    importInto(editor, next)
      .then(() => {
        if (instance.current === editor) setError(null)
      })
      .catch((reason: unknown) => {
        if (instance.current !== editor) return
        setError(reason instanceof Error ? reason.message : 'The diagram could not be opened')
      })
  }

  // Create (and when the editing mode changes, re-create) the diagram-js editor.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const additionalModules: EditorModule[] = withQuickAdd ? [traceContextPadModule] : []
    const editor = createProcessEditor(container, { readOnly, additionalModules })
    instance.current = editor

    if (validateLive) {
      validator.current = createLiveValidator<string, LiveResult>({
        delayMs: VALIDATION_DELAY_MS,
        produce: checkDiagram,
        equals: (a, b) => sameIssues(a.issues, b.issues) && sameNames(a.names, b.names),
        apply: (result) => {
          if (instance.current !== editor) return
          editor.setIssues(result.issues)
          setLive(result)
          latest.current.onIssuesChange?.(result.issues)
        },
        onError: (reason) => console.error('[bpmn-editor] validation failed', reason),
      })
    }

    const offSelection = editor.onSelection((id) => latest.current.onSelect?.(id))
    const offChange = editor.onChange(() => {
      refreshHistory(editor)
      editor
        .exportXml()
        .then((out) => {
          if (instance.current !== editor) return
          shownXml.current = out
          validator.current?.notify(out)
          latest.current.onXmlChange?.(out)
        })
        .catch((reason: unknown) => console.error('[bpmn-editor] export failed', reason))
    })
    load(editor, latest.current.xml)
    return () => {
      offSelection()
      offChange()
      validator.current?.dispose()
      validator.current = null
      instance.current = null
      shownXml.current = null
      setLive(null)
      editor.destroy()
    }
    // load/refreshHistory only touch refs and state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, withQuickAdd, validateLive])

  // Re-import when the parent passes XML the canvas is not already showing.
  useEffect(() => {
    const editor = instance.current
    if (editor && xml !== shownXml.current) load(editor, xml)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml])

  useEffect(() => {
    instance.current?.setCompareStates(compareStates)
  }, [compareStates])

  useEffect(() => {
    if (!validateLive) instance.current?.setIssues(issues)
  }, [issues, validateLive])

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
        importXml: (next) => importInto(live(), next),
        exportXml: () => live().exportXml(),
        onSelection: (cb) => live().onSelection(cb),
        onChange: (cb) => live().onChange(cb),
        getAuditFields: (id) => live().getAuditFields(id),
        setAuditFields: (id, fields) => live().setAuditFields(id, fields),
        getElementInfo: (id) => instance.current?.getElementInfo(id) ?? null,
        renameElement: (id, name) => instance.current?.renameElement(id, name) ?? false,
        startLabelEdit: (id) => instance.current?.startLabelEdit(id) ?? false,
        setCompareStates: (states) => instance.current?.setCompareStates(states),
        setIssues: (list) => instance.current?.setIssues(list),
        fit: () => instance.current?.fit(),
        undo: () => instance.current?.undo(),
        redo: () => instance.current?.redo(),
        zoomBy: (delta) => instance.current?.zoomBy(delta),
        destroy: () => instance.current?.destroy(),
        canUndo: () => instance.current?.canUndo() ?? false,
        canRedo: () => instance.current?.canRedo() ?? false,
        selectElement: (id) => instance.current?.selectElement(id) ?? false,
        findElement: (query) => instance.current?.findElement(query) ?? null,
        startCreate: (type, event) => instance.current?.startCreate(type, event),
        addElement: (type) => instance.current?.addElement(type) ?? null,
      }
    },
    // importInto only reads refs and calls state setters, so the handle can stay stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const toolbarIssues = useMemo<ToolbarIssue[] | null>(() => {
    if (!validateLive) return null
    if (!live) return []
    return orderIssues(live.issues).map((issue) => ({
      ...issue,
      elementName: issue.elementId ? live.names[issue.elementId] : undefined,
    }))
  }, [live, validateLive])

  // Shortcuts while focus is on the toolbar or palette (the canvas handles its own).
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const editor = instance.current
    if (!editor || event.defaultPrevented || isTextInput(event.target)) return
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (key === '0') editor.fit()
    else if (readOnly) return
    else if (key === 'z' && event.shiftKey) editor.redo()
    else if (key === 'z') editor.undo()
    else if (key === 'y') editor.redo()
    else return
    event.preventDefault()
  }

  return (
    <div
      onKeyDown={onKeyDown}
      className={cn('trace-bpmn-editor flex h-full min-h-[420px] w-full flex-col overflow-hidden', className)}
    >
      {toolbar ? (
        <EditorToolbar
          editable={!readOnly}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={() => instance.current?.undo()}
          onRedo={() => instance.current?.redo()}
          onZoomIn={() => instance.current?.zoomBy(1)}
          onZoomOut={() => instance.current?.zoomBy(-1)}
          onFit={() => instance.current?.fit()}
          onSearch={(query) => {
            const editor = instance.current
            const id = editor?.findElement(query)
            return !!(editor && id && editor.selectElement(id))
          }}
          issues={toolbarIssues}
          onIssueSelect={(issue) => {
            if (issue.elementId) instance.current?.selectElement(issue.elementId)
          }}
        />
      ) : null}
      <div className="flex min-h-0 flex-1">
        {/* Beside the canvas, not over it, so "fit" never hides steps under the palette. */}
        {showPalette ? (
          <EditorPalette
            className="shrink-0 overflow-y-auto border-r border-border"
            onAdd={(type) => instance.current?.addElement(type)}
            onDragStart={(type, event) => instance.current?.startCreate(type, event)}
          />
        ) : null}
        <div className="relative min-w-0 flex-1">
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
      </div>
    </div>
  )
}

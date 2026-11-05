// TEMPORARY: verification page for the Task 9 editor core and the Task 10
// usability layer (toolbar, palette, quick-add, live validation). Task 13a
// deletes this route.
'use client'

import { useState } from 'react'
import { BpmnEditor } from '@/components/process-flows/bpmn-editor'
import { ElementPropertiesPanel } from '@/components/process-flows/element-properties-panel'
import type { ProcessEditor } from '@/lib/bpmn/editor'
import { emptyProcessXml, parseBpmnXml } from '@/lib/bpmn/graph'
import { SCRATCH_SEED_XML } from '@/lib/bpmn/editor/__scratch-seed'
import { computeMetrics } from '@/modules/process-flows/metrics'

const button =
  'rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring'

export default function BpmnScratchPage() {
  const [editor, setEditor] = useState<ProcessEditor | null>(null)
  const [xml, setXml] = useState(SCRATCH_SEED_XML)
  const [readOnly, setReadOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [changes, setChanges] = useState(0)
  const [issueCount, setIssueCount] = useState<number | null>(null)
  const [report, setReport] = useState('')

  const roundTrip = async () => {
    const current = editor
    if (!current) return
    const exported = await current.exportXml()
    const before = await parseBpmnXml(exported)
    await current.importXml(exported)
    const after = await parseBpmnXml(await current.exportXml())
    const same = before.ok && after.ok && JSON.stringify(before.graph) === JSON.stringify(after.graph)
    setReport(same ? `round trip OK (${before.ok ? before.graph.elements.length : 0} elements)` : 'round trip MISMATCH')
  }

  // Task 12 check: lane of every step and the hand-off count of the exported XML.
  const laneReport = async () => {
    const current = editor
    if (!current) return
    const exported = await current.exportXml()
    const parsed = await parseBpmnXml(exported)
    if (!parsed.ok) return setReport(`parse error: ${parsed.error}`)
    const lanes = parsed.graph.elements.map((e) => `${e.id}@${e.laneId ?? '-'}`).join(' ')
    const processes = (exported.match(/<bpmn:process /g) ?? []).length
    setReport(`handoffs=${computeMetrics(parsed.graph).handoffs} processes=${processes} ${lanes}`)
    ;(window as unknown as { __traceXml?: string }).__traceXml = exported
  }

  return (
    <main className="flex h-screen flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-lg font-semibold">BPMN editor scratch (temporary)</h1>
        <button className={button} onClick={() => void roundTrip()}>Export, re-import, compare</button>
        <button className={button} onClick={() => { setSelected(null); setReadOnly((v) => !v) }}>
          {readOnly ? 'Make editable' : 'Make read-only'}
        </button>
        <button className={button} onClick={() => void laneReport()}>Lane report</button>
        <button className={button} onClick={() => setXml(SCRATCH_SEED_XML)}>Reset seed</button>
        <button className={button} onClick={() => void emptyProcessXml('New process').then(setXml)}>
          Start empty
        </button>
        <span className="text-sm text-muted-foreground" data-testid="status">
          selected: {selected ?? 'none'} · changes: {changes} · issues: {issueCount ?? '-'} · {report}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 gap-3">
      <section className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-border">
        <BpmnEditor
          xml={xml}
          readOnly={readOnly}
          editorRef={setEditor}
          onSelect={setSelected}
          onIssuesChange={(list) => setIssueCount(list.length)}
          onXmlChange={(next) => {
            setChanges((n) => n + 1)
            setXml(next)
          }}
        />
      </section>
      <div className="w-80 shrink-0 overflow-hidden rounded-lg border border-border">
        <ElementPropertiesPanel
          editor={editor}
          selectedId={selected}
          readOnly={readOnly}
          lockedReason="Locked — approved versions can't be edited"
          onRaiseFinding={(id) => setReport(`raise finding: ${id}`)}
          onLinkRecommendation={(id) => setReport(`link recommendation: ${id}`)}
          evidenceHref="/bpmn-scratch#evidence"
        />
      </div>
      </div>
    </main>
  )
}

// TEMPORARY: verification page for the Task 9 editor core. Task 13a deletes this route.
'use client'

import { useRef, useState } from 'react'
import { BpmnEditor } from '@/components/process-flows/bpmn-editor'
import type { ProcessEditor } from '@/lib/bpmn/editor'
import { parseBpmnXml } from '@/lib/bpmn/graph'
import { SCRATCH_SEED_XML } from '@/lib/bpmn/editor/__scratch-seed'

const button =
  'rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring'

export default function BpmnScratchPage() {
  const editor = useRef<ProcessEditor>(null)
  const [xml, setXml] = useState(SCRATCH_SEED_XML)
  const [readOnly, setReadOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [changes, setChanges] = useState(0)
  const [report, setReport] = useState('')

  const roundTrip = async () => {
    const current = editor.current
    if (!current) return
    const exported = await current.exportXml()
    const before = await parseBpmnXml(exported)
    await current.importXml(exported)
    const after = await parseBpmnXml(await current.exportXml())
    const same = before.ok && after.ok && JSON.stringify(before.graph) === JSON.stringify(after.graph)
    setReport(same ? `round trip OK (${before.ok ? before.graph.elements.length : 0} elements)` : 'round trip MISMATCH')
  }

  return (
    <main className="flex h-screen flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-lg font-semibold">BPMN editor scratch (temporary)</h1>
        <button className={button} onClick={() => editor.current?.undo()}>Undo</button>
        <button className={button} onClick={() => editor.current?.redo()}>Redo</button>
        <button className={button} onClick={() => editor.current?.fit()}>Fit</button>
        <button className={button} onClick={() => editor.current?.zoomBy(1)}>Zoom in</button>
        <button className={button} onClick={() => editor.current?.zoomBy(-1)}>Zoom out</button>
        <button className={button} onClick={() => void roundTrip()}>Export, re-import, compare</button>
        <button className={button} onClick={() => setReadOnly((v) => !v)}>
          {readOnly ? 'Make editable' : 'Make read-only'}
        </button>
        <button className={button} onClick={() => setXml(SCRATCH_SEED_XML)}>Reset seed</button>
        <span className="text-sm text-muted-foreground" data-testid="status">
          selected: {selected ?? 'none'} · changes: {changes} · {report}
        </span>
      </header>
      <section className="min-h-0 flex-1 rounded-lg border border-border">
        <BpmnEditor
          xml={xml}
          readOnly={readOnly}
          editorRef={editor}
          onSelect={setSelected}
          onXmlChange={(next) => {
            setChanges((n) => n + 1)
            setXml(next)
          }}
        />
      </section>
    </main>
  )
}

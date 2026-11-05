'use client'

// next/dynamic with { ssr: false } from a Client Component, per
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md ("Skipping SSR"):
// diagram-js needs the DOM, so the canvas must never prerender on the server.
import dynamic from 'next/dynamic'

export type { BpmnEditorProps } from './bpmn-editor-canvas'

export const BpmnEditor = dynamic(() => import('./bpmn-editor-canvas'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[420px] w-full items-center justify-center text-sm text-muted-foreground"
      role="status"
    >
      Loading diagram…
    </div>
  ),
})

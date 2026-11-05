import { AuditHeader } from '@/components/audits/audit-header'
import { AuditTabs } from '@/components/audits/audit-tabs'
import { ProcessFlowWorkspace } from '@/components/process-flows/process-flow-workspace'
import { parseMockRole } from '@/data/mock/process-flows'
import { supportsProcessWorkflow } from '@/modules/process-flows/workflow-support'

// Server Component page: `params` and `searchParams` are Promises and must be awaited
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md);
// ProcessFlowWorkspace is a Client Component and loads the editor via next/dynamic, ssr: false.
export default async function WorkflowPage({
  params,
  searchParams,
}: {
  params: Promise<{ auditId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { auditId } = await params
  // `?as=<Role>` exists solely so reviewers can exercise the permission gating in
  // development; it is ignored in production builds and has no UI.
  const as = process.env.NODE_ENV !== 'production' ? (await searchParams).as : undefined
  const devRole = parseMockRole(typeof as === 'string' ? as : undefined)
  let id = auditId
  try {
    id = decodeURIComponent(auditId)
  } catch {
    // Malformed percent-encoding: keep the raw id rather than failing the page.
  }
  return (
    <div>
      <AuditHeader />
      <AuditTabs />
      {supportsProcessWorkflow(id) ? (
        <ProcessFlowWorkspace key={`${id}:${devRole ?? ''}`} auditId={id} devRole={devRole} />
      ) : (
        <p className="mt-6 rounded-lg border border-border p-6 text-sm text-muted-foreground">
          The process workflow isn&apos;t available for this audit type.
        </p>
      )}
    </div>
  )
}

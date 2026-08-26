import { ArrowRight, Bot, CalendarClock, ChevronRight, ExternalLink, FileOutput, Globe2, ShieldAlert, TriangleAlert } from 'lucide-react'
import { auditFindings } from '@/data/mock/findings'
import { Panel } from '@/components/ui/card'

const severityColor: Record<string, string> = { High: 'bg-[oklch(0.58_0.2_35)]', Medium: 'bg-[oklch(0.72_0.17_65)]', Low: 'bg-[oklch(0.48_0_0)]' }

export function AuditOverview() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Panel className="grid gap-6 p-5 md:grid-cols-[1fr_180px_1.5fr] md:items-center">
          <div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-brand"><Globe2 className="size-6" /></span><div><a href="https://oakandpixel.co.za" className="flex items-center gap-2 text-lg font-semibold">https://oakandpixel.co.za <ExternalLink className="size-4" /></a><p className="mt-1 text-xs text-muted-foreground">oakandpixel.co.za</p></div></div>
          <div><p className="text-sm font-semibold">Health Score</p><p className="mt-1 text-3xl font-semibold text-brand">72 <span className="text-base font-normal text-muted-foreground">/100</span></p><p className="mt-2 flex items-center gap-2 text-xs"><span className="size-2 rounded-full bg-warning" /> Needs Improvement</p></div>
          <div><p className="text-sm font-semibold">Summary</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The site is technically sound but has several on-page and content issues that impact visibility, accessibility, and user trust. Address the high and medium priority findings to improve performance and conversions.</p></div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Findings (9)</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Affected Page(s)</th><th className="px-4 py-3">Why it matters</th><th className="px-4 py-3">Recommended Action</th><th /></tr></thead><tbody>{auditFindings.map((finding) => <tr key={finding.issue} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="px-4 py-2.5"><span className="flex items-center gap-2"><span className={`size-2 rounded-full ${severityColor[finding.severity]}`} />{finding.severity}</span></td><td className="px-4 py-2.5 font-medium">{finding.issue}</td><td className="px-4 py-2.5 text-muted-foreground">{finding.pages}</td><td className="px-4 py-2.5 text-muted-foreground">{finding.why}</td><td className="px-4 py-2.5 text-muted-foreground">{finding.action}</td><td className="px-3"><ChevronRight className="size-4" /></td></tr>)}</tbody></table></div>
        </Panel>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard icon={<FileOutput className="size-5" />} label="Pages Crawled" value="38" detail="2 Excluded" tone="info" />
          <MetricCard icon={<Bot className="size-5" />} label="Total Issues" value="85" detail="12 Errors" />
          <MetricCard icon={<TriangleAlert className="size-5" />} label="High Priority" value="3" detail="33% of issues" tone="brand" />
          <MetricCard icon={<ShieldAlert className="size-5" />} label="Medium Priority" value="3" detail="33% of issues" tone="warning" />
          <MetricCard icon={<TriangleAlert className="size-5" />} label="Low Priority" value="3" detail="33% of issues" />
        </div>
      </div>

      <aside className="space-y-4">
        <Panel className="p-4"><h3 className="mb-4 text-sm font-semibold">Audit Overview</h3><InfoRows rows={[["Audit ID", "TRC-WEB-2026-0042"], ["Audit Type", "Website Audit"], ["Framework", "HIMARK Web Audit v1.0"], ["Completed", "20 Aug 2026, 10:42 AM"], ["Duration", "00:04:32"], ["Pages Crawled", "38"], ["Crawl Type", "Standard"], ["User Agent", "TRACE Bot/1.0"]]} /></Panel>
        <Panel className="p-4"><h3 className="mb-4 text-sm font-semibold">Audit Scope</h3><InfoRows rows={[["Start URL", "https://oakandpixel.co.za"], ["Included Pages", "38"], ["Excluded Pages", "2"], ["Crawl Depth", "3"]]} /><a href="#" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">View scope details <ArrowRight className="size-3.5" /></a></Panel>
        <Panel className="p-4"><h3 className="mb-4 text-sm font-semibold">Frameworks &amp; Next Steps</h3><div className="space-y-4"><NextStep icon={<FileOutput className="size-4" />} title="Create Project in HIVE" detail="Send findings to HIVE as a project" score="72" /><NextStep icon={<Bot className="size-4" />} title="Create Workstream in UNISON" detail="Push priority actions to UNISON" score="68" /><NextStep icon={<CalendarClock className="size-4" />} title="Schedule Re-audit" detail="Re-audit recommended in 30 days" score="70" /></div><a href="#" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand">Manage integrations <ArrowRight className="size-3.5" /></a></Panel>
      </aside>
    </div>
  )
}

function MetricCard({ icon, label, value, detail, tone = 'neutral' }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: 'neutral' | 'brand' | 'warning' | 'info' }) {
  const tones = { neutral: 'bg-muted text-foreground', brand: 'bg-brand-muted text-brand', warning: 'bg-warning-muted text-warning', info: 'bg-info-muted text-info' }
  return <Panel className="p-4"><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</span><div><p className="text-xs font-semibold">{label}</p><p className="mt-1 text-2xl font-semibold text-brand">{value}</p></div></div><p className="mt-3 text-center text-xs text-muted-foreground">{detail}</p></Panel>
}

function InfoRows({ rows }: { rows: readonly (readonly [string, string])[] }) { return <dl className="space-y-3 text-xs">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-mono text-[11px]">{value}</dd></div>)}</dl> }
function NextStep({ icon, title, detail, score }: { icon: React.ReactNode; title: string; detail: string; score: string }) { return <div className="flex items-start gap-3"><span className="mt-0.5 text-muted-foreground">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p></div><span className="font-semibold text-brand">{score}<span className="text-[10px] font-normal text-muted-foreground"> /100</span></span></div> }

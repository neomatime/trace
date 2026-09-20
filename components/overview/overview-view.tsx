'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  House,
  Layers3,
  ListChecks,
  Monitor,
  MoreHorizontal,
  Network,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const metricCards = [
  { label: 'Total Audits', value: '8', trend: '+2', context: 'vs last 30 days', icon: Layers3, tone: 'brand' },
  { label: 'Active Audits', value: '3', trend: '0', context: 'no change', icon: Gauge, tone: 'info' },
  { label: 'Awaiting Review', value: '2', trend: '+1', context: 'vs last 30 days', icon: Clock3, tone: 'brand' },
  { label: 'Reassessments Due', value: '2', trend: '+1', context: 'vs last 30 days', icon: AlertTriangle, tone: 'warning' },
  { label: 'Average Current Score', value: '75', suffix: '/ 100', trend: '+6', context: 'vs last 30 days', icon: BarChart3, tone: 'success' },
] as const

const attentionItems = [
  { count: 3, title: 'Reassessments due soon', detail: 'Next reassessment due within 30 days', icon: AlertCircle, neutral: false },
  { count: 2, title: 'Audits awaiting review', detail: 'Findings ready for review', icon: Clock3, neutral: false },
  { count: 4, title: 'High-priority findings open', detail: 'Across 3 audits', icon: AlertTriangle, neutral: false },
  { count: 1, title: 'Audit blocked', detail: 'Missing required evidence', icon: FileText, neutral: true },
  { count: 6, title: 'Actions overdue', detail: 'Past due date', icon: ListChecks, neutral: false },
] as const

const activityRows = [
  { id: 'TRC-WEB-2026-0042', audit: 'Oak & Pixel Website — Aug 2026', client: 'Oak & Pixel', stage: 'Internal Review', progress: 67, next: 'Approve findings', icon: Monitor, tone: 'review' },
  { id: 'TRC-BRN-2026-0021', audit: 'Brand Consistency Audit', client: 'Oak & Pixel', stage: 'Collection', progress: 48, next: 'Upload evidence', icon: ShieldCheck, tone: 'collection' },
  { id: 'TRC-OF-2026-0007', audit: 'Operational Flow Audit', client: 'HIMARK', stage: 'Assessment', progress: 72, next: 'Complete review', icon: Network, tone: 'assessment' },
  { id: 'TRC-DIG-2026-0018', audit: 'Digital Presence Audit', client: 'Oak & Pixel', stage: 'Findings', progress: 54, next: 'Address findings', icon: House, tone: 'findings' },
  { id: 'TRC-CUS-2026-0002', audit: 'Customer Experience Audit', client: 'HIMARK', stage: 'Planning', progress: 25, next: 'Define scope', icon: ClipboardCheck, tone: 'planning' },
] as const

const recentAudits = [
  { id: 'TRC-WEB-2026-0042', name: 'Oak & Pixel Website — Aug 2026', client: 'Oak & Pixel', type: 'Website Audit', status: 'Completed', score: '72', updated: '20 May 2026', icon: Monitor },
  { id: 'TRC-BRN-2026-0021', name: 'Oak & Pixel Brand — Aug 2026', client: 'Oak & Pixel', type: 'Brand Consistency', status: 'In Progress', score: '—', updated: '20 May 2026', icon: ShieldCheck },
  { id: 'TRC-DIG-2026-0018', name: 'Oak & Pixel Digital — Q3 2026', client: 'Oak & Pixel', type: 'Digital Presence', status: 'Completed', score: '81', updated: '12 May 2026', icon: House },
  { id: 'TRC-OF-2026-0007', name: 'Purchase-to-Pay — Baseline', client: 'HIMARK', type: 'Operational Flow', status: 'In Progress', score: '—', updated: '19 May 2026', icon: Network },
  { id: 'TRC-OF-2026-0006', name: 'Client Onboarding — Baseline', client: 'HIMARK', type: 'Operational Flow', status: 'In Progress', score: '—', updated: '18 May 2026', icon: ClipboardCheck },
] as const

const nextActions = [
  { title: 'Review Oak & Pixel findings', detail: 'Findings ready for internal review', icon: AlertCircle, href: '/audits/TRC-WEB-2026-0042/review' },
  { title: 'Start reassessment for Digital Presence Audit', detail: 'Due in 18 days', icon: RefreshCcw, href: '/audits/TRC-WEB-2026-0042/reassessment' },
  { title: 'Validate 7 evidence items', detail: 'Across 2 audits', icon: FileCheck2, href: '/evidence' },
  { title: 'Follow up on 3 overdue actions', detail: 'Past due date', icon: Clock3, href: '/audits/TRC-WEB-2026-0042/actions' },
  { title: 'Finalise Website Audit report', detail: 'Ready for export', icon: FileText, href: '/audits/TRC-WEB-2026-0042/reports' },
] as const

export function OverviewView() {
  const [timeframe, setTimeframe] = useState('Last 30 days')

  return (
    <div>
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Overview</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">Welcome back, Alex. Here&apos;s what&apos;s happening across your audits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex h-10 items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />Today, 20 May 2026</span>
          <label className="sr-only" htmlFor="overview-timeframe">Overview timeframe</label>
          <select id="overview-timeframe" value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 pr-8 font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
            <option>Last 30 days</option><option>Last 90 days</option><option>Last 12 months</option>
          </select>
        </div>
      </header>

      <section aria-label="Audit overview metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => <OverviewMetricCard key={metric.label} {...metric} />)}
      </section>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <AttentionList className="xl:col-span-3 xl:col-start-1 xl:row-start-1" />
        <AuditActivityTable className="xl:col-span-5 xl:col-start-4 xl:row-start-1" />
        <ImprovementSummary className="xl:col-span-4 xl:col-start-9 xl:row-start-1" />
        <RecommendedActions className="xl:col-span-4 xl:col-start-9 xl:row-start-2" />
        <RecentAudits className="xl:col-span-8 xl:col-start-1 xl:row-start-2" />
      </div>
    </div>
  )
}

function OverviewMetricCard({ label, value, suffix, trend, context, icon: Icon, tone }: { label: string; value: string; suffix?: string; trend: string; context: string; icon: LucideIcon; tone: 'brand' | 'info' | 'warning' | 'success' }) {
  const iconTone = { brand: 'bg-brand-muted text-brand', info: 'bg-info-muted text-info', warning: 'bg-red-50 text-red-600', success: 'bg-success-muted text-success' }[tone]
  return <Card className="flex min-h-28 items-center gap-4 p-4"><span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', iconTone)}><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-2xl font-bold leading-none">{value} {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}</p><p className="mt-2 flex items-center gap-1.5 text-[10px]"><span className={cn('font-semibold', tone === 'success' ? 'text-success' : tone === 'info' ? 'text-muted-foreground' : 'text-brand')}>{trend === '0' ? '○ 0' : `↑ ${trend}`}</span><span className="truncate text-muted-foreground">{context}</span></p></div></Card>
}

function CardHeading({ title, href = '/audits' }: { title: string; href?: string }) {
  return <div className="flex h-12 items-center justify-between border-b border-border px-4"><h2 className="text-sm font-semibold">{title}</h2><Link href={href} className="rounded-sm text-[11px] font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">View all</Link></div>
}

function AttentionList({ className }: { className?: string }) {
  return <Card className={className}><CardHeading title="What needs your attention?" />
    <ul className="divide-y divide-border px-3">{attentionItems.map(({ count, title, detail, icon: Icon, neutral }) => <li key={title}><Link href="/audits" className="group grid grid-cols-[38px_30px_minmax(0,1fr)_18px] items-center gap-1 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className={cn('flex size-8 items-center justify-center rounded-full', neutral ? 'bg-muted text-foreground' : 'bg-red-50 text-brand')}><Icon className="size-4" aria-hidden="true" /></span><strong className="text-lg">{count}</strong><span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{title}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail}</span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></li>)}</ul>
  </Card>
}

function StageBadge({ stage, tone }: { stage: string; tone: string }) {
  return <span className={cn('inline-flex rounded px-2 py-1 text-[9px] font-medium', tone === 'review' ? 'bg-purple-100 text-purple-700' : tone === 'collection' ? 'bg-info-muted text-info' : tone === 'assessment' ? 'bg-amber-100 text-amber-700' : tone === 'findings' ? 'bg-brand-muted text-brand' : 'bg-slate-100 text-slate-600')}>{stage}</span>
}

function Progress({ value }: { value: number }) {
  return <div className="flex items-center gap-2"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${value}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span className="block h-full rounded-full bg-brand" style={{ width: `${value}%` }} /></span><span className="text-[10px] font-medium">{value}%</span></div>
}

function AuditActivityTable({ className }: { className?: string }) {
  return <Card className={cn('overflow-hidden', className)}><CardHeading title="Current Audit Activity" />
    <div className="hidden sm:block"><div className="grid grid-cols-[minmax(0,1.35fr)_.62fr_.85fr_.68fr_minmax(0,1fr)_16px] gap-2 px-4 py-2 text-[9px] font-semibold text-muted-foreground"><span>Audit</span><span>Client</span><span>Stage</span><span>Progress</span><span>Next Step</span><span /></div>
      <div className="divide-y divide-border px-3">{activityRows.map(({ id, audit, client, stage, progress, next, icon: Icon, tone }) => <Link key={audit} href={`/audits/${id}`} className="group grid min-h-11 grid-cols-[minmax(0,1.35fr)_.62fr_.85fr_.68fr_minmax(0,1fr)_16px] items-center gap-2 px-1 text-[9px] hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="flex min-w-0 items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-3.5" aria-hidden="true" /></span><span className="truncate font-semibold">{audit}</span></span><span className="truncate text-muted-foreground">{client}</span><StageBadge stage={stage} tone={tone} /><Progress value={progress} /><span className="truncate text-muted-foreground">{next}</span><ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>)}</div>
    </div>
    <div className="divide-y divide-border sm:hidden">{activityRows.map(({ id, audit, client, stage, progress, next, icon: Icon, tone }) => <Link key={audit} href={`/audits/${id}`} className="block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{audit}</span><span className="mt-1 block text-[10px] text-muted-foreground">{client}</span></span><StageBadge stage={stage} tone={tone} /></div><div className="mt-3 flex items-center justify-between gap-3"><Progress value={progress} /><span className="text-[10px] text-muted-foreground">{next} →</span></div></Link>)}</div>
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[10px] text-muted-foreground"><span>Showing 5 of 8 audits</span><Link href="/audits" className="inline-flex items-center gap-1 font-semibold text-brand">Go to Audits <ArrowRight className="size-3" /></Link></div>
  </Card>
}

function ImprovementSummary({ className }: { className?: string }) {
  return <Card className={cn('overflow-hidden', className)}><div className="px-4 pt-4"><h2 className="text-sm font-semibold">Improvement Across Reassessments</h2><figure className="mt-3" aria-labelledby="improvement-chart-caption"><svg viewBox="0 0 520 190" className="h-auto w-full" role="img" aria-label="Scores improved from 58 at baseline to 81 at reassessment 3"><defs><linearGradient id="overviewArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.66 0.18 42)" stopOpacity="0.18"/><stop offset="100%" stopColor="oklch(0.66 0.18 42)" stopOpacity="0.02"/></linearGradient></defs>{[20,57.5,95,132.5,170].map((y,index)=><g key={y}><line x1="46" y1={y} x2="506" y2={y} stroke="currentColor" className="text-border" strokeWidth="1"/><text x="4" y={y+4} fontSize="10" fill="currentColor" className="text-muted-foreground">{100-index*25}</text></g>)}<path d="M72 83 C135 79 160 72 210 69.5 S300 64 350 60.5 S435 52 488 48.5 L488 170 L72 170 Z" fill="url(#overviewArea)"/><path d="M72 83 C135 79 160 72 210 69.5 S300 64 350 60.5 S435 52 488 48.5" fill="none" stroke="oklch(0.66 0.18 42)" strokeWidth="3"/>{[[72,83,58],[210,69.5,67],[350,60.5,73],[488,48.5,81]].map(([x,y,value])=><g key={value}><circle cx={x} cy={y} r="5" fill="white" stroke="oklch(0.66 0.18 42)" strokeWidth="3"/><text x={x} y={y-12} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{value}</text></g>)}</svg><figcaption id="improvement-chart-caption" className="sr-only">Baseline and reassessment scores over time.</figcaption><div className="grid grid-cols-4 gap-1 text-center text-[8px] leading-3"><span><b className="block">Baseline</b>15 Nov 2025</span><span><b className="block">Reassessment 01</b>17 Feb 2026</span><span><b className="block">Reassessment 02</b>18 May 2026</span><span><b className="block">Reassessment 03</b>20 Aug 2026</span></div></figure></div>
    <div className="mt-4 grid grid-cols-3 border-t border-border"><SummaryMetric value="61" label="Avg. baseline score"/><SummaryMetric value="78" label="Current avg. score"/><SummaryMetric value="+17" label="Net improvement" positive/><SummaryMetric value="34" label="Findings resolved" positive className="col-span-2"/><SummaryMetric value="3" label="Regressions" warning/></div>
  </Card>
}

function SummaryMetric({ value, label, positive, warning, className }: { value: string; label: string; positive?: boolean; warning?: boolean; className?: string }) {
  return <div className={cn('border-b border-r border-border p-3 last:border-r-0', className)}><strong className={cn('text-lg', positive && 'text-success', warning && 'text-brand')}>{value}</strong><span className="mt-0.5 block text-[9px] text-muted-foreground">{label}</span></div>
}

function RecommendedActions({ className }: { className?: string }) {
  return <Card className={cn('overflow-hidden', className)}><CardHeading title="Recommended Next Actions" />
    <div className="divide-y divide-border px-3">{nextActions.map(({ title, detail, icon: Icon, href }) => <Link key={title} href={href} className="group flex items-center gap-3 px-1 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"><Icon className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{title}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail}</span></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>)}</div>
  </Card>
}

function RecentAudits({ className }: { className?: string }) {
  return <Card className={cn('overflow-hidden', className)}><CardHeading title="Recent Audits" />
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] table-fixed text-left text-[10px]"><thead><tr className="h-9 border-b border-border text-[9px] text-muted-foreground"><th className="w-[34%] px-4 font-semibold">Audit Name</th><th className="w-[14%] px-2 font-semibold">Client</th><th className="w-[18%] px-2 font-semibold">Type</th><th className="w-[13%] px-2 font-semibold">Status</th><th className="w-[8%] px-2 font-semibold">Score</th><th className="w-[13%] px-2 font-semibold">Last Updated</th><th className="w-9" /></tr></thead><tbody>{recentAudits.map(({ id, name, client, type, status, score, updated, icon: Icon }) => <tr key={name} className="h-[47px] border-b border-border last:border-0 hover:bg-muted/20"><td className="px-4"><Link href={`/audits/${id}`} className="flex min-w-0 items-center gap-2 font-semibold"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-3.5" /></span><span className="truncate">{name}</span></Link></td><td className="truncate px-2 text-muted-foreground">{client}</td><td className="truncate px-2 text-muted-foreground">{type}</td><td className="px-2"><StatusBadge status={status}/></td><td className={cn('px-2 font-bold', score !== '—' && 'text-brand')}>{score}</td><td className="px-2 text-muted-foreground">{updated}</td><td className="px-2"><button aria-label={`More actions for ${name}`} className="flex size-7 items-center justify-center rounded hover:bg-muted"><MoreHorizontal className="size-4" /></button></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-border md:hidden">{recentAudits.map(({ id, name, client, type, status, score, updated, icon: Icon }) => <article key={name} className="p-4"><div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><Link href={`/audits/${id}`} className="block truncate text-xs font-semibold">{name}</Link><p className="mt-1 text-[10px] text-muted-foreground">{client} · {type}</p></div><StatusBadge status={status}/></div><div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>Score <b className={cn(score !== '—' && 'text-brand')}>{score}</b></span><span>Updated {updated}</span></div></article>)}</div>
  </Card>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded px-2 py-1 text-[9px] font-medium', status === 'Completed' ? 'bg-success-muted text-success' : 'bg-info-muted text-info')}>{status}</span>
}

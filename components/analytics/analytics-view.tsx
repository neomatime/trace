'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Factory,
  FileSpreadsheet,
  FileText,
  Globe2,
  HeartHandshake,
  Landmark,
  Layers3,
  ListChecks,
  Monitor,
  Network,
  Share2,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { DonutChart } from '@/components/charts/audit-type-chart'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'success' | 'info' | 'danger'

const kpis = [
  { label: 'Total Audits', value: '8', detail: '+2', context: 'vs last 30 days', icon: Layers3, tone: 'brand' },
  { label: 'Average Current Score', value: '75', suffix: '/ 100', detail: '+6', context: 'vs last 30 days', icon: BarChart3, tone: 'success' },
  { label: 'Net Improvement', value: '+17', detail: '', context: 'Across reassessments', icon: TrendingUp, tone: 'info' },
  { label: 'Open Findings', value: '34', detail: '9 high priority', context: '', icon: AlertTriangle, tone: 'danger' },
  { label: 'Action Completion Rate', value: '72%', detail: '+8%', context: 'vs last 30 days', icon: CheckCircle2, tone: 'success' },
  { label: 'Reassessments Due', value: '2', detail: '', context: 'Within 30 days', icon: Clock3, tone: 'brand' },
] as const

const scoreTrend = [
  { label: 'Jan', value: 58 }, { label: 'Feb', value: 64 }, { label: 'Mar', value: 67 }, { label: 'Apr', value: 73 }, { label: 'May', value: 81 },
]
const reassessmentTrend = [
  { label: 'Baseline', secondary: '15 Nov 2025', value: 58 },
  { label: 'Reassessment 01', secondary: '17 Feb 2026', value: 67 },
  { label: 'Reassessment 02', secondary: '18 May 2026', value: 73 },
  { label: 'Reassessment 03', secondary: '20 Aug 2026', value: 81 },
]
const severity = [
  { label: 'Critical', value: 5, color: 'oklch(0.63 0.2 25)' },
  { label: 'High', value: 12, color: 'oklch(0.68 0.18 45)' },
  { label: 'Medium', value: 10, color: 'oklch(0.78 0.16 80)' },
  { label: 'Low', value: 7, color: 'oklch(0.62 0.16 145)' },
]
const auditTypes = [
  ['Website Audit', 72, 14, Monitor], ['Digital Presence Audit', 81, 17, Globe2], ['Brand Consistency Audit', 68, 9, ShieldCheck], ['Operational Flow Audit', 76, 11, Network], ['People Audit', 74, 8, Users], ['Intelligence Audit', 79, 12, BrainCircuit], ['Customer Experience Audit', 71, 10, HeartHandshake],
] as const
const clients = [
  ['Oak & Pixel', 81, 23, Layers3], ['HIMARK', 76, 14, Users], ['Velocity Logistics', 73, 9, Truck], ['Nimbus Holdings', 69, 6, Landmark], ['Thoriso Metals', 67, 4, Factory],
] as const
const improvementAreas = [['Performance', 18], ['Accessibility', 12], ['Technical SEO', 9], ['Mobile Experience', 7], ['Security', 5]] as const
const watchItems = ['2 critical findings still open', 'Mobile responsiveness below target', 'Metadata inconsistencies still unresolved', '2 reassessments due this month']

export function AnalyticsView() {
  const [timeframe, setTimeframe] = useState('Last 30 days')
  const [client, setClient] = useState('All Clients')
  const [announcement, setAnnouncement] = useState('')

  return <div>
    <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-[26px] font-bold leading-tight tracking-tight">Analytics</h1><p className="mt-1.5 text-[13px] text-muted-foreground">Analyse audit performance, findings, actions and reassessment trends across your organisation.</p></div>
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex h-10 items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true"/>Today, 20 May 2026</span><FilterSelect id="analytics-period" label="Analytics timeframe" value={timeframe} onChange={setTimeframe} options={['Last 30 days','Last 90 days','Last 12 months']}/><FilterSelect id="analytics-client" label="Client filter" value={client} onChange={setClient} options={['All Clients','Oak & Pixel','HIMARK','Velocity Logistics','Nimbus Holdings','Thoriso Metals']}/></div>
    </header>

    <section aria-label="Analytics metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{kpis.map(metric=><MetricCard key={metric.label} {...metric}/>)}</section>

    <section aria-label="Analytics insights" className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-12">
      <AnalyticsCard title="Score Trend" description="Track average audit score progression over time." className="2xl:col-span-4"><TrendChart id="score-trend" points={scoreTrend}/><SummaryGrid columns={3} items={[['Baseline Avg','61'],['Current Avg','78'],['Change','+17','positive']]}/></AnalyticsCard>
      <AnalyticsCard title="Findings by Severity" className="2xl:col-span-4"><SeverityChart/><SummaryGrid columns={3} items={[['Total Findings','34'],['Resolved','18','positive'],['Open','16','warning']]}/></AnalyticsCard>
      <AnalyticsCard title="Performance by Audit Type" description="Compare score and improvement across audit types." className="lg:col-span-2 2xl:col-span-4"><PerformanceTable/></AnalyticsCard>
      <AnalyticsCard title="Client Performance" description="Compare current client scores and improvement rates." className="2xl:col-span-4"><ClientPerformance/></AnalyticsCard>
      <AnalyticsCard title="Action Analytics" description="Track how corrective and improvement actions are progressing." className="2xl:col-span-4"><ActionAnalytics/></AnalyticsCard>
      <AnalyticsCard title="Reassessment Impact" description="Measure how reassessments improve performance over time." className="2xl:col-span-4"><TrendChart id="reassessment-impact" points={reassessmentTrend} compact/><SummaryGrid columns={4} items={[['Improvement Rate','100%','positive'],['Total Score Gain','+23','positive'],['Regressions','3','warning'],['Resolved Findings','34','positive']]}/></AnalyticsCard>
      <ImprovementAreas className="2xl:col-span-6"/>
      <WatchItems className="2xl:col-span-6"/>
      <SavedViews className="lg:col-span-2 2xl:col-span-12" onAction={setAnnouncement}/>
    </section>
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </div>
}

function FilterSelect({id,label,value,onChange,options}:{id:string;label:string;value:string;onChange:(value:string)=>void;options:string[]}) {
  return <><label htmlFor={id} className="sr-only">{label}</label><select id={id} value={value} onChange={event=>onChange(event.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 pr-8 font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">{options.map(option=><option key={option}>{option}</option>)}</select></>
}

function MetricCard({label,value,suffix,detail,context,icon:Icon,tone}:{label:string;value:string;suffix?:string;detail:string;context:string;icon:LucideIcon;tone:Tone}) {
  const palette={brand:'bg-brand-muted text-brand',success:'bg-success-muted text-success',info:'bg-info-muted text-info',danger:'bg-red-50 text-red-600'}[tone]
  return <Card className="flex min-h-24 items-center gap-3 p-4"><span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full',palette)}><Icon className="size-5" aria-hidden="true"/></span><div className="min-w-0"><p className="truncate text-[10px] text-muted-foreground">{label}</p><p className={cn('mt-0.5 text-2xl font-bold leading-none',label==='Net Improvement'&&'text-success')}>{value} {suffix&&<span className="text-sm font-medium text-muted-foreground">{suffix}</span>}</p><p className="mt-1.5 truncate text-[9px]"><span className={cn('font-semibold',tone==='success'?'text-success':tone==='danger'?'text-brand':detail?'text-brand':'text-muted-foreground')}>{detail&&(detail.startsWith('+')?'↑ ':'')}{detail}</span>{detail&&context&&<span className="mx-1 text-muted-foreground">·</span>}<span className="text-muted-foreground">{context}</span></p></div></Card>
}

function AnalyticsCard({title,description,className,children}:{title:string;description?:string;className?:string;children:React.ReactNode}) {
  return <Card className={cn('overflow-hidden',className)}><div className="px-4 pt-4"><h2 className="text-sm font-semibold">{title}</h2>{description&&<p className="mt-1 text-[10px] text-muted-foreground">{description}</p>}</div>{children}</Card>
}

function TrendChart({id,points,compact=false}:{id:string;points:{label:string;secondary?:string;value:number}[];compact?:boolean}) {
  const coords=points.map((point,index)=>({x:48+index*(440/(points.length-1)),y:160-point.value*1.35,...point}))
  const line=coords.map(point=>`${point.x},${point.y}`).join(' ')
  const area=`M ${coords.map(point=>`${point.x} ${point.y}`).join(' L ')} L ${coords.at(-1)?.x} 160 L ${coords[0].x} 160 Z`
  return <figure className="px-3 pt-2"><svg viewBox="0 0 520 174" className={cn('w-full',compact?'h-36':'h-40')} role="img" aria-label={points.map(point=>`${point.label}: ${point.value}`).join(', ')}><defs><linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.66 0.18 42)" stopOpacity=".2"/><stop offset="100%" stopColor="oklch(0.66 0.18 42)" stopOpacity=".02"/></linearGradient></defs>{[25,50,75,100].map(value=>{const y=160-value*1.35;return <g key={value}><line x1="38" y1={y} x2="502" y2={y} className="text-border" stroke="currentColor"/><text x="2" y={y+4} fontSize="9" className="fill-muted-foreground">{value}</text></g>})}<path d={area} fill={`url(#${id}-area)`}/><polyline points={line} fill="none" stroke="oklch(0.66 0.18 42)" strokeWidth="2.5"/>{coords.map((point,index)=><g key={point.label}><circle cx={point.x} cy={point.y} r={index===coords.length-1?5:4} fill="white" stroke="oklch(0.66 0.18 42)" strokeWidth="2.5"/><text x={point.x} y={point.y-10} textAnchor="middle" fontSize="10" fontWeight="700">{point.value}</text></g>)}</svg><figcaption className="grid gap-1 text-center text-[8px] leading-3" style={{gridTemplateColumns:`repeat(${points.length},minmax(0,1fr))`}}>{points.map(point=><span key={point.label}><b className="block truncate">{point.label}</b>{point.secondary&&<span className="block truncate text-muted-foreground">{point.secondary}</span>}</span>)}</figcaption></figure>
}

function SummaryGrid({columns,items}:{columns:number;items:(readonly [string,string,('positive'|'warning')?])[]}) {
  return <div className="mt-3 grid border-t border-border" style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}}>{items.map(([label,value,tone],index)=><div key={label} className={cn('min-w-0 p-3',index>0&&'border-l border-border')}><p className="truncate text-[9px] text-muted-foreground">{label}</p><p className={cn('mt-1 text-lg font-bold',tone==='positive'&&'text-success',tone==='warning'&&'text-brand')}>{value}</p></div>)}</div>
}

function SeverityChart() {
  return <div className="grid min-h-[196px] grid-cols-[minmax(150px,1fr)_minmax(120px,.8fr)] items-center gap-4 px-5 py-3"><div className="relative mx-auto"><DonutChart data={severity} size={142} thickness={28}/><span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><b className="text-2xl">34</b><span className="text-[10px] text-muted-foreground">Total Findings</span></span></div><ul className="space-y-3">{severity.map(item=><li key={item.label} className="flex items-center gap-2 text-[11px]"><span className="size-3 rounded-full" style={{background:item.color}}/><span className="flex-1">{item.label}</span><b>{item.value}</b></li>)}</ul></div>
}

function ScoreBar({value,color='brand'}:{value:number;color?:'brand'|'success'}) {
  return <span className="flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={`${value} out of 100`}><span className={cn('block h-full rounded-full',color==='success'?'bg-success':'bg-brand')} style={{width:`${value}%`}}/></span><b className="w-6 text-right text-[10px]">{value}</b></span>
}

function PerformanceTable() {
  return <div className="table-scroll mt-3 overflow-x-auto border-t border-border"><div className="min-w-[520px] 2xl:min-w-0"><div className="grid grid-cols-[minmax(160px,1.3fr)_minmax(120px,1fr)_72px] gap-3 border-b border-border px-4 py-2 text-[9px] font-semibold text-muted-foreground"><span>Audit Type</span><span>Current Score</span><span>Improvement</span></div>{auditTypes.map(([name,score,improvement,Icon])=><div key={name} className="grid min-h-9 grid-cols-[minmax(160px,1.3fr)_minmax(120px,1fr)_72px] items-center gap-3 border-b border-border px-4 text-[10px] last:border-0"><span className="flex min-w-0 items-center gap-2 font-medium"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-3"/></span><span className="truncate">{name}</span></span><ScoreBar value={score}/><b className="text-success">+{improvement}</b></div>)}</div></div>
}

function ClientPerformance() {
  return <div className="table-scroll mt-3 overflow-x-auto border-t border-border"><div className="min-w-[440px]"><div className="grid grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_60px] gap-3 px-4 py-2 text-[9px] font-semibold text-muted-foreground"><span>Client</span><span>Current Score</span><span>Change</span></div>{clients.map(([name,score,change,Icon])=><div key={name} className="grid min-h-10 grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_60px] items-center gap-3 border-t border-border px-4 text-[10px]"><span className="flex items-center gap-2 font-medium"><span className="flex size-6 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-3"/></span>{name}</span><ScoreBar value={score}/><b className="text-success">+{change}</b></div>)}</div></div>
}

function ActionAnalytics() {
  const months=[['Jan',11,6,4],['Feb',14,7,4],['Mar',16,8,5],['Apr',15,7,4],['May',10,6,5]] as const
  return <><div className="grid grid-cols-2 gap-2 px-4 pt-3 sm:grid-cols-4"><MiniMetric label="Total Actions" value="42" icon={ListChecks} tone="brand"/><MiniMetric label="Completed" value="30" icon={CheckCircle2} tone="success"/><MiniMetric label="Overdue" value="6" icon={AlertTriangle} tone="danger"/><MiniMetric label="In Progress" value="6" icon={Clock3} tone="brand"/></div><div className="relative mx-4 mt-3 h-32 border-b border-l border-border"><div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">{[0,1,2].map(value=><span key={value} className="border-t border-border"/>)}</div><div className="absolute inset-x-3 bottom-0 flex h-full items-end justify-around gap-4">{months.map(([month,completed,progress,overdue])=><div key={month} className="flex h-full flex-1 flex-col items-center justify-end"><div className="flex w-full max-w-11 flex-col justify-end overflow-hidden rounded-t-sm" aria-label={`${month}: ${completed} completed, ${progress} in progress, ${overdue} overdue`}><span className="bg-red-400" style={{height:`${overdue*3}px`}}/><span className="bg-orange-400" style={{height:`${progress*3}px`}}/><span className="bg-success" style={{height:`${completed*3}px`}}/></div><span className="absolute -bottom-5 text-[9px] text-muted-foreground">{month}</span></div>)}</div></div><div className="mt-7 flex justify-center gap-5 pb-3 text-[9px]"><Legend color="bg-success" label="Completed"/><Legend color="bg-orange-400" label="In Progress"/><Legend color="bg-red-400" label="Overdue"/></div></>
}

function MiniMetric({label,value,icon:Icon,tone}:{label:string;value:string;icon:LucideIcon;tone:Tone}) {
  return <div className="flex items-center gap-2"><span className={cn('flex size-7 items-center justify-center rounded-full',tone==='success'?'bg-success-muted text-success':tone==='danger'?'bg-red-50 text-red-600':'bg-brand-muted text-brand')}><Icon className="size-3.5"/></span><span><span className="block text-[8px] text-muted-foreground">{label}</span><b className="text-sm">{value}</b></span></div>
}

function Legend({color,label}:{color:string;label:string}) { return <span className="inline-flex items-center gap-1.5"><span className={cn('size-2.5 rounded-full',color)}/>{label}</span> }

function ImprovementAreas({className}:{className?:string}) {
  return <Card className={cn('grid items-center gap-4 p-4 sm:grid-cols-[160px_1fr]',className)}><h2 className="text-sm font-semibold">Top Improvement Areas</h2><div className="space-y-2">{improvementAreas.map(([label,value])=><div key={label} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-[9px]"><span className="truncate text-muted-foreground">{label}</span><span className="h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-success" style={{width:`${Math.max(20,value*5)}%`}}/></span><b className="text-success">+{value}</b></div>)}</div></Card>
}

function WatchItems({className}:{className?:string}) {
  return <Card className={cn('grid items-start gap-3 p-4 sm:grid-cols-[120px_1fr]',className)}><h2 className="text-sm font-semibold">Watch Items</h2><ul className="divide-y divide-border">{watchItems.map((item,index)=><li key={item} className="flex min-h-7 items-center gap-2 text-[9px]"><span className={cn('flex size-5 items-center justify-center rounded-full',index<2?'bg-red-50 text-red-600':'bg-brand-muted text-brand')}>{index<2?<AlertTriangle className="size-3"/>:<Clock3 className="size-3"/>}</span><span className="flex-1 truncate text-muted-foreground">{item}</span><ChevronRight className="size-3.5"/></li>)}</ul></Card>
}

function SavedViews({className,onAction}:{className?:string;onAction:(message:string)=>void}) {
  const views=[[FileText,'Executive Summary','Key metrics and trends'],[TrendingUp,'Reassessment Trends','Score progression over time'],[Users,'Findings by Client','Client comparison and insights']] as const
  const actions=[[Download,'Export PDF'],[FileSpreadsheet,'Export CSV'],[Share2,'Share Dashboard']] as const
  return <Card className={cn('flex flex-col gap-3 p-3 xl:flex-row xl:items-center',className)}><h2 className="shrink-0 px-1 text-sm font-semibold">Saved Views</h2><div className="grid flex-1 gap-2 sm:grid-cols-3">{views.map(([Icon,title,detail])=><button key={title} onClick={()=>onAction(`${title} view opened in this UI preview.`)} className="flex min-w-0 items-center gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"><Icon className="size-3.5"/></span><span className="min-w-0"><b className="block truncate text-[9px]">{title}</b><span className="block truncate text-[8px] text-muted-foreground">{detail}</span></span></button>)}</div><div className="flex flex-wrap gap-2">{actions.map(([Icon,label])=><button key={label} onClick={()=>onAction(`${label} is available as a UI preview only.`)} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-[10px] font-semibold hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Icon className="size-3.5"/>{label}</button>)}</div></Card>
}

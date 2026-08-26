'use client'

import { useState } from 'react'
import {
  AlertTriangle, ArrowLeftRight, CalendarDays, CheckCircle2, CircleGauge, Download,
  FileBarChart, RefreshCw, Target, TrendingDown, TrendingUp,
} from 'lucide-react'
import { DonutChart } from '@/components/charts/audit-type-chart'
import { Card, StatRow } from '@/components/ui/card'
import { CrudActionMenu, CrudToast } from '@/components/ui/crud'
import { StatusBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const tabs = ['Overview', 'Compare', 'Finding Changes', 'Evidence', 'Reports'] as const
type Tab = (typeof tabs)[number]

const historyRows = [
  ['Reassessment 03', '20 Aug 2026', 'Alex Reed', '81', '+8', 'Completed'],
  ['Reassessment 02', '18 May 2026', 'Thelma Dube', '73', '+6', 'Completed'],
  ['Reassessment 01', '17 Feb 2026', 'Alex Reed', '67', '+9', 'Completed'],
  ['Baseline Assessment', '15 Nov 2025', 'Alex Reed', '58', '—', 'Baseline'],
] as const

const comparisonAssessments = {
  'Baseline Assessment': { date: '15 Nov 2025', score: '58' },
  'Reassessment 01': { date: '17 Feb 2026', score: '67' },
  'Reassessment 02': { date: '18 May 2026', score: '73' },
  'Reassessment 03': { date: '20 Aug 2026', score: '81' },
} as const

export function ReassessmentOverview() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [message, setMessage] = useState('')

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold">Reassessment</h2>
        <p className="mt-1 text-xs text-muted-foreground">Track what changed across audit cycles, measure improvement, and prove impact over time.</p>
      </div>

      <div className="mt-4 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-7" role="tablist" aria-label="Reassessment sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'border-b-2 border-transparent px-1 pb-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                activeTab === tab && 'border-brand font-semibold text-brand',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && <OverviewContent onMessage={setMessage} />}
      {activeTab === 'Compare' && <CompareContent onMessage={setMessage} />}
      {activeTab === 'Finding Changes' && <FindingChanges />}
      {activeTab === 'Evidence' && <EvidenceChanges />}
      {activeTab === 'Reports' && <ReportsPanel onMessage={setMessage} />}
      {message && <CrudToast message={message} onClose={() => setMessage('')} />}
    </div>
  )
}

function OverviewContent({ onMessage }: { onMessage: (message: string) => void }) {
  return (
    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        <KpiStrip />
        <div className="grid gap-4 lg:grid-cols-[1.55fr_.95fr]">
          <ImprovementChart />
          <ComparisonSnapshot />
        </div>
        <HistoryTable onMessage={onMessage} />
      </div>
      <InsightsAside onMessage={onMessage} />
    </div>
  )
}

function KpiStrip() {
  const metrics = [
    { label: 'Current Score', value: '81', detail: undefined, icon: CircleGauge, tone: 'brand' },
    { label: 'Baseline Score', value: '58', detail: undefined, icon: CalendarDays, tone: 'brand' },
    { label: 'Net Improvement', value: '+23', detail: '(+39.7%)', icon: TrendingUp, tone: 'success' },
    { label: 'Resolved Findings', value: '12', detail: 'of 18', icon: CheckCircle2, tone: 'success' },
    { label: 'Reassessments', value: '3', detail: 'Completed', icon: RefreshCw, tone: 'brand' },
  ] as const
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
        <Card key={label} className="flex min-h-20 items-center gap-3 p-3.5">
          <span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full', tone === 'success' ? 'bg-success-muted text-success' : 'bg-brand-muted text-brand')}><Icon className="size-5" /></span>
          <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 whitespace-nowrap text-xl font-semibold">{value}{detail && <span className={cn('ml-1.5 text-[10px] font-medium', tone === 'success' ? 'text-success' : 'text-muted-foreground')}>{detail}</span>}</p></div>
        </Card>
      ))}
    </div>
  )
}

function ImprovementChart() {
  const points = [[94, 112], [248, 86], [402, 76], [552, 58]] as const
  const labels = [['Baseline Assessment', '15 Nov 2025'], ['Reassessment 01', '17 Feb 2026'], ['Reassessment 02', '18 May 2026'], ['Reassessment 03', '20 Aug 2026']] as const
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-xs font-semibold">Improvement Overview</h3><p className="mt-1 text-[10px] text-muted-foreground">Score progression across baseline and reassessment cycles.</p></div><span className="text-[10px] font-medium text-success">+23 points overall</span></div>
      <svg viewBox="0 0 620 180" className="mt-2 h-[190px] w-full" role="img" aria-label="Scores improved from 58 at baseline to 81 after three reassessments">
        {[28, 71, 114, 157].map((y, index) => <g key={y}><line x1="34" y1={y} x2="590" y2={y} stroke="currentColor" className="text-border" strokeWidth="1"/><text x="8" y={y + 3} fontSize="9" fill="currentColor" className="text-muted-foreground">{[100,75,50,25][index]}</text></g>)}
        <path d="M94 112 C150 106 192 92 248 86 S350 80 402 76 S500 63 552 58 L552 158 L94 158 Z" fill="oklch(0.64 0.18 40 / .08)" />
        <path d="M94 112 C150 106 192 92 248 86 S350 80 402 76 S500 63 552 58" fill="none" stroke="oklch(0.64 0.18 40)" strokeWidth="3" />
        {points.map(([x,y],index) => <g key={x}><circle cx={x} cy={y} r="5" fill="white" stroke="oklch(0.64 0.18 40)" strokeWidth="3"/><text x={x} y={y-12} textAnchor="middle" fontSize="11" fontWeight="700">{[58,67,73,81][index]}</text><text x={x} y="169" textAnchor="middle" fontSize="8.5" fontWeight="600">{labels[index][0]}</text><text x={x} y="179" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">{labels[index][1]}</text></g>)}
      </svg>
    </Card>
  )
}

function ComparisonSnapshot() {
  const rows = [
    ['Score', '58', '+23', '81', 'up'],
    ['Findings', '18', '-9', '9', 'down'],
    ['High Priority', '6', '-4', '2', 'down'],
    ['Evidence Items', '31', '+17', '48', 'up'],
  ] as const
  return (
    <Card className="p-4">
      <h3 className="text-xs font-semibold">Comparison Snapshot</h3><p className="mt-1 text-[10px] text-muted-foreground">Baseline vs latest reassessment at a glance.</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-3 text-[9px]"><div><p className="font-semibold">Baseline Assessment</p><p className="mt-1 text-muted-foreground">15 Nov 2025</p></div><span /><div className="text-right"><p className="font-semibold">Latest Reassessment</p><p className="mt-1 text-muted-foreground">20 Aug 2026</p></div></div>
      <div className="mt-3 divide-y divide-border">{rows.map(([label, baseline, change, latest, direction]) => <div key={label} className="grid grid-cols-[1fr_45px_45px_28px] items-center gap-2 py-3 text-[10px]"><span>{label}</span><strong>{baseline}</strong><span className="inline-flex items-center gap-1 font-semibold text-success">{direction === 'up' ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>}{change}</span><strong>{latest}</strong></div>)}</div>
    </Card>
  )
}

function HistoryTable({ onMessage }: { onMessage: (message: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[10px]">
          <thead><tr className="border-b border-border bg-muted/10">{['Reassessment History', 'Date', 'Completed By', 'Score', 'Change', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>{historyRows.map((row) => <tr key={row[0]} className="border-b border-border last:border-0"><td className="px-3 py-3"><span className="inline-flex items-center gap-3 font-semibold"><span className="inline-flex size-7 items-center justify-center rounded-md bg-brand-muted"><TrendingUp className="size-3.5 text-brand"/></span>{row[0]}</span></td><td className="px-3 py-3 text-muted-foreground">{row[1]}</td><td className="px-3 py-3 text-muted-foreground">{row[2]}</td><td className="px-3 py-3">{row[3]}</td><td className="px-3 py-3">{row[4]}</td><td className="px-3 py-3"><StatusBadge status={row[5]} className="text-[10px]"/></td><td className="px-3 py-2"><CrudActionMenu label={`${row[0]} actions`} actions={[{ label: 'View assessment', kind: 'view', onSelect: () => onMessage(`${row[0]} opened.`) }, { label: 'Compare with baseline', kind: 'duplicate', onSelect: () => onMessage(`${row[0]} comparison opened.`) }, { label: 'Generate report', kind: 'duplicate', onSelect: () => onMessage(`${row[0]} report prepared.`) }]} /></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  )
}

function InsightsAside({ onMessage }: { onMessage: (message: string) => void }) {
  const improvements = [['Performance', '+18', 92], ['Accessibility', '+12', 74], ['Technical SEO', '+9', 58], ['Mobile Experience', '+7', 46], ['Security', '+5', 36]] as const
  return (
    <aside className="space-y-4">
      <Card className="p-4"><h3 className="text-xs font-semibold">Reassessment Summary</h3><div className="mt-4 flex items-center gap-5"><div className="relative shrink-0"><DonutChart data={[{label:'Improved',value:75,color:'oklch(0.58 0.17 150)'},{label:'Remaining',value:25,color:'oklch(0.84 0.03 250)'}]} size={90} thickness={14}/><strong className="absolute inset-0 flex items-center justify-center text-lg">+23</strong></div><div className="flex-1 space-y-2"><StatRow label="Completed cycles" value="3"/><StatRow label="Latest change" value="+8"/><StatRow label="Overall change" value="+23"/></div></div><div className="mt-4 border-t border-border pt-3"><StatRow label="Improvement rate" tooltip="Share of completed reassessments that improved on the linked baseline." value="100%" valueClassName="text-success"/></div></Card>
      <Card className="p-4"><h3 className="text-xs font-semibold">Top Improvements</h3><div className="mt-4 space-y-3">{improvements.map(([label,value,width]) => <div key={label} className="grid grid-cols-[1fr_88px_28px] items-center gap-2 text-[9px]"><span>{label}</span><span className="h-1.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-success" style={{width:`${width}%`}}/></span><strong className="text-right">{value}</strong></div>)}</div></Card>
      <Card className="border-brand/20 bg-brand-muted/25 p-4"><h3 className="flex items-center gap-2 text-xs font-semibold text-brand"><AlertTriangle className="size-4"/>Watch Items</h3><ul className="mt-3 space-y-2 pl-5 text-[10px] leading-4"><li className="list-disc">2 findings remain open</li><li className="list-disc">Mobile responsiveness still below target</li><li className="list-disc">Brand metadata inconsistencies still unresolved</li></ul></Card>
      <Card className="p-4"><h3 className="flex items-center gap-2 text-xs font-semibold"><Target className="size-4 text-success"/>Next Step</h3><p className="mt-4 text-[9px] text-muted-foreground">Recommended action</p><p className="mt-1 text-xs font-semibold">Start Reassessment 04 in 30 days</p><p className="mt-3 text-[9px] text-muted-foreground">Suggested focus</p><p className="mt-1 text-[10px] font-semibold">Accessibility and Mobile Experience</p><button type="button" onClick={() => onMessage('Reassessment 04 created as a draft.')} className="mt-4 h-9 w-full rounded-md bg-primary text-[10px] font-semibold text-primary-foreground"><span className="inline-flex items-center gap-2"><TrendingUp className="size-3.5"/>Start Reassessment</span></button></Card>
    </aside>
  )
}

function CompareContent({ onMessage }: { onMessage: (message: string) => void }) {
  const [baseline, setBaseline] = useState('Baseline Assessment')
  const [current, setCurrent] = useState('Reassessment 03')
  const swapAssessments = () => {
    const previousBaseline = baseline
    setBaseline(current)
    setCurrent(previousBaseline)
    onMessage('Comparison direction swapped.')
  }

  return <div className="mt-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h3 className="text-lg font-semibold">Compare Assessments</h3><p className="mt-1 text-[11px] text-muted-foreground">Compare baseline and reassessment results to visualise improvement over time.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="baseline-assessment">Baseline assessment</label><select id="baseline-assessment" value={baseline} onChange={event => setBaseline(event.target.value)} className="h-9 min-w-40 rounded-md border border-border bg-background px-3 text-[10px] font-medium outline-none focus:border-brand">{Object.keys(comparisonAssessments).map(assessment => <option key={assessment}>{assessment}</option>)}</select>
        <button type="button" onClick={swapAssessments} aria-label="Swap compared assessments" className="inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-muted"><ArrowLeftRight className="size-3.5"/></button>
        <label className="sr-only" htmlFor="current-assessment">Current assessment</label><select id="current-assessment" value={current} onChange={event => setCurrent(event.target.value)} className="h-9 min-w-40 rounded-md border border-border bg-background px-3 text-[10px] font-medium outline-none focus:border-brand">{Object.keys(comparisonAssessments).reverse().map(assessment => <option key={assessment}>{assessment}</option>)}</select>
        <button type="button" onClick={() => onMessage('Comparison export prepared.')} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-[10px] font-semibold hover:bg-muted"><Download className="size-3.5"/>Export Comparison</button>
      </div>
    </div>
    <ComparisonKpis />
    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr]"><ScoreComparison/><CategoryBreakdown/></div>
        <FindingsProgress />
        <ComparisonTimeline />
      </div>
      <ComparisonAside baseline={baseline} current={current} />
    </div>
  </div>
}

function ComparisonKpis() {
  const metrics = [
    { label: 'Previous Score', value: '58', icon: CalendarDays, tone: 'brand' },
    { label: 'Current Score', value: '81', icon: CircleGauge, tone: 'brand' },
    { label: 'Score Change', value: '+23', detail: '(+39.7%)', icon: TrendingUp, tone: 'success' },
    { label: 'Issues Resolved', value: '14', detail: 'of 22', icon: CheckCircle2, tone: 'success' },
    { label: 'Improvement Rate', value: '39.7%', icon: RefreshCw, tone: 'brand' },
  ] as const
  return <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{metrics.map(metric => { const Icon = metric.icon; const detail = 'detail' in metric ? metric.detail : undefined; return <Card key={metric.label} className="flex min-h-20 items-center gap-3 p-3.5"><span className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full', metric.tone === 'success' ? 'bg-success-muted text-success' : 'bg-brand-muted text-brand')}><Icon className="size-5"/></span><div><p className="text-[10px] text-muted-foreground">{metric.label}</p><p className="mt-1 whitespace-nowrap text-xl font-semibold">{metric.value}{detail&&<span className={cn('ml-2 text-[10px]',metric.tone==='success'?'text-success':'text-muted-foreground')}>{detail}</span>}</p></div></Card> })}</div>
}

function ScoreComparison() {
  return <Card className="p-4"><h3 className="text-xs font-semibold">Score Comparison</h3><p className="mt-1 text-[10px] text-muted-foreground">Baseline vs latest reassessment</p><svg viewBox="0 0 360 210" className="mt-2 h-52 w-full" role="img" aria-label="Baseline score 58 compared with current score 81"><line x1="30" y1="174" x2="340" y2="174" stroke="currentColor" className="text-border"/><line x1="30" y1="128" x2="340" y2="128" stroke="currentColor" className="text-border"/><line x1="30" y1="82" x2="340" y2="82" stroke="currentColor" className="text-border"/><line x1="30" y1="36" x2="340" y2="36" stroke="currentColor" className="text-border"/>{[['0',174],['25',128],['50',82],['75',36]].map(([label,y])=><text key={label} x="5" y={Number(y)+3} fontSize="9" fill="currentColor" className="text-muted-foreground">{label}</text>)}<rect x="78" y="68" width="68" height="106" rx="3" fill="oklch(0.86 0.02 250)"/><rect x="222" y="26" width="68" height="148" rx="3" fill="oklch(0.64 0.18 40)"/><text x="112" y="58" textAnchor="middle" fontSize="13" fontWeight="700">58</text><text x="256" y="17" textAnchor="middle" fontSize="13" fontWeight="700">81</text><text x="112" y="192" textAnchor="middle" fontSize="9" fontWeight="600">Baseline Assessment</text><text x="112" y="204" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">15 Nov 2025</text><text x="256" y="192" textAnchor="middle" fontSize="9" fontWeight="600">Reassessment 03</text><text x="256" y="204" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">20 Aug 2026</text></svg><div className="mt-2 flex items-center justify-center gap-2 rounded-md bg-success-muted py-2 text-[10px] font-medium text-success"><TrendingUp className="size-3.5"/>Overall improvement: +23 points</div></Card>
}

function CategoryBreakdown() {
  const rows = [['Performance','54','78','+24'],['Accessibility','49','72','+23'],['SEO / On-Page','61','80','+19'],['Mobile Experience','57','74','+17'],['Security','64','76','+12'],['Technical Health','63','79','+16']] as const
  return <Card className="overflow-hidden"><div className="p-4 pb-2"><h3 className="text-xs font-semibold">Category Breakdown</h3><p className="mt-1 text-[10px] text-muted-foreground">Compare audit category performance across both assessments</p></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-[10px]"><thead><tr>{['Category','Baseline','Current','Change','Status'].map(item=><th key={item} className="px-3 py-2 font-semibold">{item}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]} className="border-t border-border"><td className="px-3 py-2.5 font-medium">{row[0]}</td><td className="px-3 py-2.5">{row[1]}</td><td className="px-3 py-2.5">{row[2]}</td><td className="px-3 py-2.5 font-semibold text-success">↑ {row[3]}</td><td className="px-3 py-2.5"><span className="rounded-md bg-success-muted px-2 py-0.5 font-medium text-success">Improved</span></td></tr>)}</tbody></table></div></Card>
}

function FindingsProgress() {
  const stats = [['Open findings before','22','bg-brand-muted'],['Open findings now','9','bg-success-muted'],['Resolved','13','bg-success-muted'],['New findings','0','bg-info-muted']] as const
  const priorities = [['High','7','2','-5',66],['Medium','9','4','-5',42],['Low','6','3','-3',24]] as const
  return <Card className="overflow-hidden"><div className="border-b border-border px-4 py-3"><h3 className="text-xs font-semibold">Findings Progress</h3><p className="mt-1 text-[10px] text-muted-foreground">Track what changed between assessments</p></div><div className="grid gap-4 p-4 lg:grid-cols-[.75fr_1.25fr]"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value,tone])=><div key={label} className={cn('rounded-md p-3',tone)}><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div><div><div className="grid grid-cols-[1fr_42px_42px_48px_1fr] gap-2 border-b border-border pb-2 text-[9px] font-semibold"><span>Priority</span><span>Before</span><span>Now</span><span>Change</span><span /></div>{priorities.map(([label,before,now,change,width])=><div key={label} className="grid grid-cols-[1fr_42px_42px_48px_1fr] items-center gap-2 border-b border-border py-2.5 text-[10px] last:border-0"><span>{label}</span><span>{before}</span><span>{now}</span><span className="font-medium text-success">↓ {change}</span><span className="h-1.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-brand" style={{width:`${width}%`}}/></span></div>)}</div></div></Card>
}

function ComparisonTimeline() {
  const points = [[105,92],[330,72],[555,62],[785,46]] as const
  return <Card className="p-4"><h3 className="text-xs font-semibold">Improvement Timeline</h3><p className="mt-1 text-[10px] text-muted-foreground">Assessment progression across cycles</p><svg viewBox="0 0 900 130" className="mt-1 h-32 w-full" role="img" aria-label="Timeline improving from 58 to 81"><path d="M105 92 C190 86 245 78 330 72 S470 66 555 62 S700 52 785 46 L785 106 L105 106Z" fill="oklch(0.64 0.18 40 / .08)"/><path d="M105 92 C190 86 245 78 330 72 S470 66 555 62 S700 52 785 46" fill="none" stroke="oklch(0.64 0.18 40)" strokeWidth="2.5"/>{points.map(([x,y],index)=><g key={x}><circle cx={x} cy={y} r="4.5" fill="white" stroke="oklch(0.64 0.18 40)" strokeWidth="2.5"/><text x={x} y={y-11} textAnchor="middle" fontSize="10" fontWeight="700">{[58,67,73,81][index]}</text><text x={x} y="119" textAnchor="middle" fontSize="8.5" fontWeight="600">{['Baseline Assessment','Reassessment 01','Reassessment 02','Reassessment 03'][index]}</text><text x={x} y="129" textAnchor="middle" fontSize="8" fill="currentColor" className="text-muted-foreground">{['15 Nov 2025','17 Feb 2026','18 May 2026','20 Aug 2026'][index]}</text></g>)}</svg></Card>
}

function ComparisonAside({ baseline, current }: { baseline: string; current: string }) {
  const improvements = [['Performance','+24',95],['Accessibility','+23',88],['SEO / On-Page','+19',72],['Mobile Experience','+17',63],['Technical Health','+16',59]] as const
  const baselineDetails = comparisonAssessments[baseline as keyof typeof comparisonAssessments] ?? comparisonAssessments['Baseline Assessment']
  const currentDetails = comparisonAssessments[current as keyof typeof comparisonAssessments] ?? comparisonAssessments['Reassessment 03']
  return <aside className="space-y-4"><Card className="p-4"><h3 className="text-xs font-semibold">Comparison Summary</h3><div className="mt-4 flex items-center gap-4"><div className="relative shrink-0"><DonutChart data={[{label:'Improvement',value:62,color:'oklch(0.64 0.18 40)'},{label:'Baseline',value:38,color:'oklch(0.87 0.02 250)'}]} size={86} thickness={14}/><strong className="absolute inset-0 flex items-center justify-center text-lg">+23</strong></div><div className="flex-1 space-y-2"><StatRow label="Baseline score" value="58"/><StatRow label="Current score" value="81"/><StatRow label="Difference" value="+23"/></div></div><div className="mt-4 border-t border-border pt-3"><StatRow label="Improvement rate" tooltip="Percentage increase from the selected baseline score to the current score." value="39.7%" valueClassName="text-success"/></div></Card><Card className="p-4"><h3 className="text-xs font-semibold">Top Improvements</h3><div className="mt-4 space-y-3">{improvements.map(([label,value,width],index)=><div key={label} className="grid grid-cols-[12px_1fr_76px_28px] items-center gap-2 text-[9px]"><strong>{index+1}</strong><span>{label}</span><span className="h-1.5 rounded-full bg-muted"><span className="block h-full rounded-full bg-brand" style={{width:`${width}%`}}/></span><strong className="text-right">{value}</strong></div>)}</div></Card><Card className="border-brand/20 bg-brand-muted/25 p-4"><h3 className="flex items-center gap-2 text-xs font-semibold text-brand"><AlertTriangle className="size-4"/>Still Needs Attention</h3><ul className="mt-3 space-y-2 pl-5 text-[10px] leading-4"><li className="list-disc">Accessibility still below target benchmark</li><li className="list-disc">2 high-priority findings remain open</li><li className="list-disc">Mobile experience requires further optimisation</li></ul></Card><Card className="p-4"><h3 className="text-xs font-semibold">Compared Assessments</h3><div className="mt-4 space-y-4"><ComparedAssessment name={baseline} date={baselineDetails.date} score={baselineDetails.score} baseline/><ComparedAssessment name={current} date={currentDetails.date} score={currentDetails.score}/></div></Card></aside>
}

function ComparedAssessment({ name, date, score, baseline=false }: { name:string; date:string; score:string; baseline?:boolean }) {
  return <div className="flex items-start gap-3"><span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted">{baseline?<CircleGauge className="size-4 text-brand"/>:<TrendingUp className="size-4 text-brand"/>}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[10px] font-semibold">{name}</p><span className="whitespace-nowrap text-[9px] text-muted-foreground">{date}</span></div><div className="mt-1 flex justify-between gap-2 text-[9px] text-muted-foreground"><span>Completed by Alex Reed</span><span>Score: <b className="text-foreground">{score}</b></span></div></div></div>
}

function FindingChanges() {
  const rows = [['Performance', '6', '2', '4 resolved'], ['Accessibility', '4', '2', '2 resolved'], ['Technical SEO', '3', '1', '2 resolved'], ['Mobile Experience', '3', '2', '1 resolved'], ['Security', '2', '2', 'No change']] as const
  return <Card className="mt-4 overflow-hidden"><div className="border-b border-border p-4"><h3 className="text-xs font-semibold">Finding Changes</h3><p className="mt-1 text-[10px] text-muted-foreground">Movement from baseline to the latest reassessment.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-muted/20"><tr>{['Category','Baseline Findings','Current Findings','Movement'].map(item=><th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]} className="border-t border-border"><td className="px-4 py-3 font-medium">{row[0]}</td><td className="px-4 py-3">{row[1]}</td><td className="px-4 py-3">{row[2]}</td><td className={cn('px-4 py-3 font-medium',row[3]==='No change'?'text-muted-foreground':'text-success')}>{row[3]}</td></tr>)}</tbody></table></div></Card>
}

function EvidenceChanges() {
  const items = [['New evidence since baseline','17'],['Evidence retained from baseline','31'],['Validated evidence','42'],['Needs review','6']] as const
  return <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(([label,value])=><Card key={label} className="p-5"><FileBarChart className="size-5 text-brand"/><p className="mt-5 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Card>)}</div>
}

function ReportsPanel({ onMessage }: { onMessage: (message: string) => void }) {
  return <Card className="mt-4 p-6"><h3 className="text-base font-semibold">Reassessment reports</h3><p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">Prepare a comparison report that documents baseline results, movement by category, resolved findings, remaining risks and supporting evidence.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => onMessage('Executive comparison report prepared.')} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground">Generate comparison report</button><button type="button" onClick={() => onMessage('Evidence change register prepared.')} className="h-9 rounded-md border border-border px-4 text-xs font-semibold">Export evidence changes</button></div></Card>
}

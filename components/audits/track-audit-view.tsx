'use client'

import { useState } from 'react'
import {
  AlertTriangle, CalendarDays, Check, CheckCircle2, CircleGauge, Clock3, FileText,
  Flag, Search, ShieldCheck, Target, UserRound, UsersRound,
} from 'lucide-react'
import { AuditHeader } from './audit-header'
import { AuditTabs } from './audit-tabs'
import { Card, StatRow } from '@/components/ui/card'
import { DonutChart } from '@/components/charts/audit-type-chart'
import { StatusBadge } from '@/components/ui/badge'
import { CrudToast } from '@/components/ui/crud'
import { cn } from '@/lib/utils'

const stages = [
  ['Audit Created', '15 Aug'], ['Scope Confirmed', '15 Aug'], ['Evidence Collection', '16–17 Aug'],
  ['Assessment In Progress', '17–18 Aug'], ['Findings Drafted', '18 Aug'], ['Internal Review', '19 Aug'],
  ['Recommendations Finalised', 'Upcoming'], ['Client Action', 'Upcoming'], ['Reassessment', 'Upcoming'], ['Completed', 'Upcoming'],
] as const

const stageBreakdown = [
  ['Automated Scan', 'Website Crawl', 'Complete', '100'],
  ['On-Page Analysis', 'PageSpeed Insights', 'Complete', '100'],
  ['Performance', 'Google Lighthouse', 'Complete', '100'],
  ['Accessibility', 'Mobile Friendly Test', 'In Progress', '48'],
  ['Mobile Experience', 'Security Headers', 'In Progress', '44'],
  ['Security', 'Manual Review', 'In Progress', '40'],
  ['Findings Drafting', 'Compile Findings', 'Not Started', '0'],
  ['Review', 'Internal Review', 'In Progress', '30'],
  ['Report Preparation', 'Final Report', 'Not Started', '0'],
] as const

const activity = [
  ['Alex Reed', 'created the audit', '15 Aug 2026, 10:12 AM', 'user'],
  ['Automated crawl', 'completed', '15 Aug 2026, 10:45 AM', 'success'],
  ['12 evidence files', 'uploaded', '16 Aug 2026, 02:31 PM', 'info'],
  ['Thelma Dube', 'added 3 findings', '18 Aug 2026, 11:07 AM', 'brand'],
  ['Maya Khan', 'moved audit to Internal Review', '19 Aug 2026, 09:15 AM', 'user'],
  ['Client action', 'requested', '20 Aug 2026, 09:38 AM', 'warning'],
] as const

export function TrackAuditView() {
  const [activeStage, setActiveStage] = useState(5)
  const [message, setMessage] = useState('')
  const stage = stages[activeStage]

  return <div>
    <AuditHeader />
    <AuditTabs />
    <KpiStrip currentStage={stage[0]} />
    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        <Card className="p-4">
          <div><h2 className="text-xs font-semibold">Audit Progress</h2><p className="mt-1 text-[10px] text-muted-foreground">Track where this audit is in its lifecycle and what remains to be completed.</p></div>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="relative grid min-w-[920px] grid-cols-10 gap-2 before:absolute before:left-[5%] before:right-[5%] before:top-3 before:h-px before:bg-border">
              {stages.map(([label,date], index) => {
                const complete = index < activeStage
                const current = index === activeStage
                return <button key={label} type="button" onClick={() => { setActiveStage(index); setMessage(`Tracking focus changed to ${label}.`) }} aria-current={current?'step':undefined} className="relative z-10 flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <span className={cn('inline-flex size-6 items-center justify-center rounded-full border bg-background text-[9px] font-semibold',complete&&'border-success bg-success text-white',current&&'border-brand text-brand',!complete&&!current&&'border-border text-muted-foreground')}>{complete?<Check className="size-3.5"/>:index+1}</span>
                  <span className={cn('mt-2 max-w-[78px] text-[9px] font-semibold leading-3',current&&'text-brand')}>{label}</span><span className="mt-1 text-[8px] text-muted-foreground">{date}</span>
                </button>
              })}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[.9fr_1.35fr]">
            <CurrentStageCard stage={stage[0]} index={activeStage} />
            <StageBreakdown />
          </div>
        </Card>
        <RecentActivity />
      </div>
      <AuditTrackingAside onMessage={setMessage} />
    </div>
    {message&&<CrudToast message={message} onClose={()=>setMessage('')}/>} 
  </div>
}

function KpiStrip({ currentStage }: { currentStage: string }) {
  const metrics = [
    { label: 'Current Stage', value: currentStage, icon: Flag },
    { label: 'Overall Progress', value: '67%', icon: CircleGauge },
    { label: 'Days Elapsed', value: '5', icon: CalendarDays },
    { label: 'Open Findings', value: '9', icon: Search },
    { label: 'Evidence Items', value: '48', icon: FileText },
  ]
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{metrics.map(({label,value,icon:Icon})=><Card key={label} className="flex min-h-20 items-center gap-3 p-3.5"><span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"><Icon className="size-5"/></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-base font-semibold">{value}</p></div></Card>)}</div>
}

function CurrentStageCard({ stage, index }: { stage: string; index: number }) {
  const completed = Math.min(index, 4)
  return <Card className="p-4"><h3 className="text-xs font-semibold text-brand">Current Stage: {stage}</h3><div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="space-y-4"><Detail icon={UserRound} label="Owner" value={index===5?'Maya Khan':'Alex Reed'}/><Detail icon={Clock3} label="Started" value={index===5?'19 Aug 2026, 09:15 AM':'15 Aug 2026, 10:12 AM'}/><Detail icon={CalendarDays} label="Due date" value="21 Aug 2026"/><div><p className="text-[9px] text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={index<5?'Completed':'In Progress'} className="text-[9px]"/></div></div><Detail icon={Target} label="Next action" value={index===5?'Approve findings pack':'Continue stage tasks'}/></div><div className="rounded-md border border-border p-4">{[['Findings reviewed',completed>=1],['Evidence validated',completed>=2],['Reviewer comments resolved',completed>=3],['Approval submitted',completed>=4]].map(([label,done])=><div key={String(label)} className="flex items-center gap-2 border-b border-border py-3 text-[10px] first:pt-0 last:border-0 last:pb-0"><span className={cn('inline-flex size-4 items-center justify-center rounded-full border',done?'border-success text-success':'border-brand text-brand')}>{done?<Check className="size-2.5"/>:<Clock3 className="size-2.5"/>}</span>{label}</div>)}</div></div></Card>
}

function Detail({ icon:Icon, label, value }: { icon:typeof UserRound; label:string; value:string }) {
  return <div className="flex gap-2"><Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"/><div><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-0.5 text-[10px] font-semibold">{value}</p></div></div>
}

function StageBreakdown() {
  return <Card className="overflow-hidden"><div className="border-b border-border px-3 py-2.5"><h3 className="text-[10px] font-semibold">Stage Breakdown</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-[9px]"><thead><tr>{['Stage / Area','Status','Progress'].map(item=><th key={item} className="px-3 py-2 font-semibold">{item}</th>)}</tr></thead><tbody>{stageBreakdown.map(([name,source,status,progress])=><tr key={name} className="border-t border-border"><td className="px-3 py-1.5"><div className="flex items-center gap-2"><span className="inline-flex size-5 items-center justify-center rounded-full bg-muted"><ShieldCheck className="size-3"/></span><span><b className="block font-medium">{name}</b><span className="text-[8px] text-muted-foreground">{source}</span></span></div></td><td className="px-3 py-1.5"><StatusBadge status={status} className="text-[8px]"/></td><td className="px-3 py-1.5"><div className="flex items-center gap-2"><b className="w-8 text-right">{progress}%</b><span className="h-1.5 w-14 rounded-full bg-muted"><span className={cn('block h-full rounded-full',status==='Complete'?'bg-success':status==='In Progress'?'bg-brand':'bg-muted-foreground/20')} style={{width:`${progress}%`}}/></span></div></td></tr>)}</tbody></table></div></Card>
}

function RecentActivity() {
  return <Card className="p-4"><h3 className="text-xs font-semibold">Recent Activity</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{activity.map(([name,action,date,tone])=><div key={`${name}-${action}`} className="relative flex gap-3 xl:block xl:pr-3 after:absolute after:left-3 after:top-7 after:h-[calc(100%-14px)] after:w-px after:bg-border sm:after:hidden xl:after:left-auto xl:after:right-0 xl:after:top-3 xl:after:h-px xl:after:w-5 last:after:hidden"><span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full',tone==='success'?'bg-success-muted text-success':tone==='info'?'bg-info-muted text-info':tone==='warning'?'bg-warning-muted text-warning':'bg-brand-muted text-brand')}>{tone==='success'?<CheckCircle2 className="size-3.5"/>:tone==='info'?<FileText className="size-3.5"/>:<UsersRound className="size-3.5"/>}</span><div className="min-w-0 xl:mt-2"><p className="text-[9px] font-semibold">{name}</p><p className="text-[8px] leading-3 text-muted-foreground">{action}</p><p className="mt-2 text-[8px] text-muted-foreground">{date}</p></div></div>)}</div></Card>
}

function AuditTrackingAside({ onMessage }: { onMessage:(message:string)=>void }) {
  return <aside className="space-y-4"><Card className="p-4"><h3 className="text-xs font-semibold">Lifecycle Overview</h3><div className="mt-4 flex items-center gap-5"><div className="relative shrink-0"><DonutChart data={[{label:'Completed',value:5,color:'oklch(0.58 0.17 150)'},{label:'In Progress',value:1,color:'oklch(0.64 0.18 40)'},{label:'Upcoming',value:4,color:'oklch(0.86 0.02 250)'}]} size={96} thickness={15}/><strong className="absolute inset-0 flex items-center justify-center text-base">5 / 10</strong></div><div className="flex-1 space-y-2"><Legend color="bg-success" label="Completed" value="5"/><Legend color="bg-brand" label="In Progress" value="1"/><Legend color="bg-muted-foreground/35" label="Upcoming" value="4"/></div></div></Card><Card className="p-4"><h3 className="flex items-center gap-2 text-xs font-semibold"><UsersRound className="size-4 text-brand"/>Audit Team</h3><div className="mt-4 space-y-3"><TeamMember initials="AR" name="Alex Reed" role="Audit Lead"/><TeamMember initials="TD" name="Thelma Dube" role="Auditor"/><TeamMember initials="MK" name="Maya Khan" role="Reviewer"/></div></Card><Card className="border-brand/20 bg-brand-muted/25 p-4"><h3 className="flex items-center gap-2 text-xs font-semibold text-brand"><AlertTriangle className="size-4"/>Attention Required</h3><ul className="mt-3 space-y-2 pl-5 text-[10px] leading-4"><li className="list-disc">Client brand guidelines still pending</li><li className="list-disc">2 findings awaiting reviewer approval</li><li className="list-disc">Reassessment cannot start until client action is complete</li></ul></Card><Card className="p-4"><h3 className="flex items-center gap-2 text-xs font-semibold"><CalendarDays className="size-4"/>SLA / Timeline</h3><div className="mt-4 space-y-2"><StatRow label="Started" value="15 Aug 2026"/><StatRow label="Estimated completion" value="22 Aug 2026"/><StatRow label="Days remaining" value="2"/><StatRow label="Last activity" value="20 Aug 2026, 10:38 AM"/></div><button type="button" onClick={()=>onMessage('Timeline details opened.')} className="mt-4 h-8 w-full rounded-md border border-border text-[10px] font-semibold hover:bg-muted">View timeline details</button></Card></aside>
}

function Legend({color,label,value}:{color:string;label:string;value:string}) { return <div className="flex items-center justify-between gap-2 text-[9px]"><span className="inline-flex items-center gap-2"><span className={cn('size-2 rounded-full',color)}/>{label}</span><b>{value}</b></div> }
function TeamMember({initials,name,role}:{initials:string;name:string;role:string}) { return <div className="flex items-center gap-3"><span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">{initials}</span><div><p className="text-[10px] font-semibold">{name}</p><p className="text-[9px] text-muted-foreground">{role}</p></div></div> }

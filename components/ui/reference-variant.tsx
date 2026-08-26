'use client'

import { ArchiveRestore, FileText, MoreHorizontal, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Card, StatRow } from './card'
import { StatusBadge } from './badge'
import { DonutChart } from '@/components/charts/audit-type-chart'
import { ConfirmActionDialog, CrudActionMenu, CrudToast } from './crud'
import { Tooltip } from './tooltip'
import { useRouter } from 'next/navigation'

type VariantConfig = {
  headers: string[]
  rows: string[][]
  total: string
  stats: [string, string][]
  chartTitle: string
  notice?: string
}

const configs: Record<string, VariantConfig> = {
  'evidence:By Audit': {
    headers: ['Audit / Assessment','Audit Type','Evidence Items','Validated','Needs Review','Storage','Last Added','Status',''], total:'136', chartTitle:'Top Evidence Types', stats:[['Active audits','12'],['Average per audit','11.3'],['Largest audit','34 items']],
    rows:[['Oak & Pixel Website — Aug 2026','Website Audit','34','25','6','684 MB','20 Aug 2026','Completed'],['HIMARK Digital Presence — Q3','Digital Presence','28','21','5','512 MB','19 Aug 2026','In Progress'],['Procure-to-Pay Flow Review','Operational Flow','24','18','4','448 MB','18 Aug 2026','Completed'],['Oak & Pixel Brand Review','Brand Consistency Audit','19','15','2','306 MB','17 Aug 2026','Completed'],['Customer Onboarding Review','Operational Flow','17','11','5','281 MB','16 Aug 2026','In Progress'],['Security Posture Assessment','Custom Audit','14','8','4','249 MB','15 Aug 2026','Under Review']],
  },
  'evidence:By Type': {
    headers:['Evidence Type','Description','Items','Storage','Average Size','Validated','Needs Review','Archived',''],total:'156',chartTitle:'Storage by Type',stats:[['Largest type','Screenshots'],['Most validated','Documents'],['Total storage','2.48 GB']],
    rows:[['Screenshots','Captured visual evidence','42','786 MB','18.7 MB','29','9','4'],['Documents','Uploaded policies and records','31','614 MB','19.8 MB','24','5','2'],['Reports','Generated and external reports','27','483 MB','17.9 MB','20','5','2'],['Images','Photographic evidence','22','326 MB','14.8 MB','13','6','3'],['Videos','Screen and process recordings','18','211 MB','11.7 MB','8','7','3'],['Data & Exports','Structured datasets','16','86 MB','5.4 MB','11','3','2']],
  },
  'evidence:Needs Review': {
    headers:['Evidence','Audit / Assessment','Review Reason','Uploaded By','Uploaded On','Priority','Action'],total:'18',chartTitle:'Top Review Reasons',stats:[['High priority','6'],['Oldest item','6 days'],['Assigned reviewers','3']],
    rows:[['Page Load Test Report','Oak & Pixel Website','Automated validation incomplete','Alex Reed','20 Aug 2026','High','Review'],['Search metadata crawl','Oak & Pixel Website','Source requires confirmation','Alex Reed','19 Aug 2026','Medium','Review'],['Invoice approval workflow','Procure-to-Pay Review','Missing owner attribution','Thelma Dube','18 Aug 2026','High','Review'],['Analytics events export','HIMARK Digital Presence','Data range is unclear','Alex Reed','18 Aug 2026','Medium','Review'],['Brand asset inventory','Oak & Pixel Brand Review','Duplicate suspected','Thelma Dube','17 Aug 2026','Low','Review'],['Security headers scan','Security Assessment','Finding link missing','Alex Reed','15 Aug 2026','High','Review']],
  },
  'evidence:Validated': {
    headers:['Evidence','Audit / Assessment','Evidence Type','Validated By','Validated On','Linked Findings','Status',''],total:'98',chartTitle:'Recently Validated',stats:[['Validated this week','23'],['Average review time','4.2 hrs'],['Validation rate','82%']],
    rows:[['Homepage mobile test','Oak & Pixel Website','Screenshot','Thelma Dube','20 Aug 2026','3','Validated'],['Heading structure export','Oak & Pixel Website','File','Alex Reed','20 Aug 2026','2','Validated'],['Website CTA recording','Oak & Pixel Website','Video','Thelma Dube','19 Aug 2026','1','Validated'],['Process interview notes','Procure-to-Pay Review','Document','Alex Reed','18 Aug 2026','4','Validated'],['Brand colour inventory','Oak & Pixel Brand Review','Image','Thelma Dube','17 Aug 2026','2','Validated'],['Channel analytics export','HIMARK Digital Presence','Data','Alex Reed','16 Aug 2026','5','Validated']],
  },
  'evidence:Archived': {
    headers:['Evidence','Original Audit','Evidence Type','Archived By','Archived On','Reason','Storage','Action'],total:'12',chartTitle:'Archive Activity',stats:[['Restorable items','12'],['Storage retained','184 MB'],['Oldest item','14 months']],notice:'Archived evidence remains read-only and can be restored at any time by an administrator.',
    rows:[['Legacy homepage capture','Website Audit — 2025','Screenshot','Alex Reed','12 Aug 2026','Superseded','28 MB','Restore'],['Old analytics export','Digital Presence — Q1','Data','Thelma Dube','10 Aug 2026','Outdated','16 MB','Restore'],['Draft interview notes','Operations Review','Document','Alex Reed','08 Aug 2026','Duplicate','8 MB','Restore'],['Previous brand inventory','Brand Review — 2025','Image','Thelma Dube','04 Aug 2026','Superseded','41 MB','Restore'],['Legacy crawl report','Website Audit — 2025','Report','Alex Reed','30 Jul 2026','Outdated','54 MB','Restore']],
  },
  'history:Assessments': {
    headers:['Assessment','Audit Type','Organisation / Scope','Completed','Score','Findings','Completed By','Status',''],total:'24',chartTitle:'Top Assessment Types',stats:[['Average score','73 / 100'],['Completed this year','18'],['Improvement rate','60%']],
    rows:[['Oak & Pixel Website — Aug 2026','Website Audit','Oak & Pixel','20 Aug 2026','81','9','Alex Reed','Completed'],['HIMARK Digital Presence — Q3','Digital Presence','HIMARK','18 Aug 2026','76','11','Thelma Dube','Completed'],['Procure-to-Pay Review','Operational Flow','Finance','15 Aug 2026','72','8','Alex Reed','Completed'],['Oak & Pixel Brand Review','Brand Consistency Audit','Oak & Pixel','12 Aug 2026','79','6','Thelma Dube','Completed'],['Customer Onboarding Review','Operational Flow','Client Services','08 Aug 2026','68','12','Alex Reed','Completed'],['Security Posture Assessment','Custom Audit','HIMARK','01 Aug 2026','64','14','Alex Reed','Completed']],
  },
  'history:Reassessments': {
    headers:['Reassessment','Original Assessment','Completed','New Score','Previous','Change','Completed By','Status',''],total:'15',chartTitle:'Score Improvement',stats:[['Average improvement','+9 pts'],['Positive movement','12'],['No change','2']],
    rows:[['Oak & Pixel Website — R03','Website — Aug 2026','20 Aug 2026','81','73','+8','Alex Reed','Completed'],['Digital Presence — R02','Digital Presence — Q2','18 Aug 2026','76','69','+7','Thelma Dube','Completed'],['Procure-to-Pay — R01','P2P Baseline','15 Aug 2026','72','61','+11','Alex Reed','Completed'],['Brand Review — R02','Brand Baseline','12 Aug 2026','79','70','+9','Thelma Dube','Completed'],['Onboarding — R01','Onboarding Baseline','08 Aug 2026','68','58','+10','Alex Reed','Completed']],
  },
  'history:Baselines': {
    headers:['Baseline','Audit Type','Organisation / Scope','Created','Initial Score','Reassessments','Created By','Status',''],total:'9',chartTitle:'Baseline Score Trend',stats:[['Active baselines','8'],['Average initial score','62'],['Reassessments linked','15']],
    rows:[['Oak & Pixel Website Baseline','Website Audit','Oak & Pixel','15 Nov 2025','58','3','Alex Reed','Baseline'],['HIMARK Digital Baseline','Digital Presence','HIMARK','10 Jan 2026','61','2','Thelma Dube','Baseline'],['Procure-to-Pay Baseline','Operational Flow','Finance','04 Feb 2026','61','1','Alex Reed','Baseline'],['Brand Consistency Baseline','Brand Consistency Audit','Oak & Pixel','12 Mar 2026','70','2','Thelma Dube','Baseline'],['Customer Onboarding Baseline','Operational Flow','Client Services','18 Apr 2026','58','1','Alex Reed','Baseline']],
  },
  'history:Archived': {
    headers:['Archived Record','Audit Type','Organisation / Scope','Completed','Score','Archived By','Reason','Action'],total:'19',chartTitle:'Archive Reasons',stats:[['Restorable','19'],['Archived this year','7'],['Average age','11 months']],notice:'Archived history is retained for governance and remains available for restore or export.',
    rows:[['Legacy Website Review','Website Audit','Oak & Pixel','12 May 2025','64','Alex Reed','Superseded','Restore'],['Digital Presence — 2024','Digital Presence','HIMARK','18 Dec 2024','59','Thelma Dube','Annual archive','Restore'],['Old Procurement Review','Operational Flow','Finance','10 Oct 2024','62','Alex Reed','Superseded','Restore'],['Brand Assessment — 2024','Brand Consistency Audit','Oak & Pixel','04 Sep 2024','67','Thelma Dube','Annual archive','Restore'],['Onboarding Review — 2024','Operational Flow','Client Services','21 Jun 2024','55','Alex Reed','Replaced','Restore']],
  },
  'frameworks:My Frameworks': {
    headers:['Framework Name','Audit Type','Version','Last Updated','Status','Usage','Visibility',''],total:'5',chartTitle:'Top Usage',stats:[['Active','4'],['Draft','1'],['Total usage','42']],
    rows:[['HIMARK Web Audit Framework','Website Audit','v3.2','20 Aug 2026','Active','18','Private'],['Operational Flow Framework','Operational Flow','v2.1','18 Aug 2026','Active','15','Organisation'],['Brand Consistency Framework','Brand Consistency Audit','v1.8','12 Aug 2026','Active','9','Private'],['Security Posture Framework','Custom Audit','v1.2','08 Aug 2026','Active','6','Organisation'],['Service Quality Draft','Custom Audit','v0.4','03 Aug 2026','Draft','0','Private']],
  },
  'frameworks:Shared With Me': {
    headers:['Framework Name','Audit Type','Shared By','Permission','Version','Last Updated','Usage',''],total:'5',chartTitle:'Top Shared By',stats:[['Can edit','2'],['View only','3'],['Organisations','3']],
    rows:[['Digital Presence Standard','Digital Presence','Thelma Dube','Can edit','v2.4','19 Aug 2026','12'],['UX Accessibility Review','Website Audit','Maya Khan','View only','v1.9','16 Aug 2026','8'],['Procurement Control Standard','Operational Flow','Daniel Mokoena','Can edit','v3.1','14 Aug 2026','14'],['Customer Experience Review','Custom Audit','Thelma Dube','View only','v1.5','11 Aug 2026','6'],['Brand Governance Standard','Brand Consistency Audit','Maya Khan','View only','v2.0','08 Aug 2026','9']],
  },
  'frameworks:Archived': {
    headers:['Framework Name','Audit Type','Version','Archived By','Archived On','Reason','Previous Usage','Action'],total:'8',chartTitle:'Archive Reasons',stats:[['Restorable','8'],['Archived this year','3'],['Previous usage','47']],notice:'Archived frameworks cannot be selected for new audits, but existing audit history remains unchanged.',
    rows:[['Website Review Standard 2024','Website Audit','v2.8','Alex Reed','12 Aug 2026','Superseded','16','Restore'],['Old Operations Framework','Operational Flow','v1.4','Thelma Dube','08 Aug 2026','Replaced','12','Restore'],['Legacy Brand Checklist','Brand Consistency Audit','v1.2','Alex Reed','01 Aug 2026','Outdated','8','Restore'],['Digital Presence — Basic','Digital Presence','v1.0','Thelma Dube','22 Jul 2026','Merged','7','Restore'],['Security Checklist 2025','Custom Audit','v2.0','Alex Reed','15 Jul 2026','Superseded','4','Restore']],
  },
  'frameworks:Deprecated': {
    headers:['Framework Name','Audit Type','Version','Deprecated On','Replacement','Active Audits','Reason','Action'],total:'6',chartTitle:'Deprecation Reasons',stats:[['With replacements','5'],['Active audit links','3'],['Pending retirement','2']],notice:'Deprecated frameworks remain available only to audits that already use them. Choose a replacement for new work.',
    rows:[['HIMARK Web Audit v2','Website Audit','v2.7','10 Aug 2026','HIMARK Web v3.2','1','New methodology','View'],['Operations Standard v1','Operational Flow','v1.9','04 Aug 2026','Operations v2.1','1','Control updates','View'],['Brand Checklist v1','Brand Consistency Audit','v1.6','28 Jul 2026','Brand v1.8','0','Scoring update','View'],['Digital Review Lite','Digital Presence','v1.2','20 Jul 2026','Digital Standard v2.4','1','Scope expanded','View'],['Security Essentials','Custom Audit','v1.0','14 Jul 2026','Security v1.2','0','Policy update','View']],
  },
}

export function ReferenceVariant({ domain, tab }: { domain: 'evidence'|'history'|'frameworks'; tab: string }) {
  const router=useRouter()
  const config = configs[`${domain}:${tab}`]
  const [restore,setRestore]=useState<string|null>(null)
  const [restored,setRestored]=useState<string[]>([])
  const [archive,setArchive]=useState<string|null>(null)
  const [archived,setArchived]=useState<string[]>([])
  const [toast,setToast]=useState('')
  if (!config) return null
  const visibleRows=config.rows.filter(row=>!archived.includes(row[0]))
  return <div>{config.notice && <div className="mb-4 flex items-center gap-3 rounded-lg border border-info/20 bg-info-muted px-4 py-3 text-[11px] text-info"><ArchiveRestore className="size-4"/><span className="flex-1">{config.notice}</span><button onClick={()=>setToast('Archive governance guidance opened.')} className="font-semibold">Learn more</button></div>}<div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_264px]"><Card className="min-w-0 overflow-hidden"><VariantTable domain={domain} tab={tab} headers={config.headers} rows={visibleRows} restored={restored} onRestore={setRestore} onArchive={setArchive} onAction={message=>setToast(message)} onNavigate={route=>router.push(route)}/><div className="flex items-center justify-between border-t border-border px-4 py-4 text-xs text-muted-foreground"><span>Showing 1 to {visibleRows.length} of {config.total} records</span><div className="flex gap-1"><button className="size-7 rounded border border-border">‹</button><button className="size-7 rounded bg-primary text-primary-foreground">1</button><button className="size-7 rounded border border-border">2</button><button className="size-7 rounded border border-border">›</button></div></div></Card><VariantAside domain={domain} total={config.total} stats={config.stats} chartTitle={config.chartTitle}/></div><ConfirmActionDialog open={Boolean(restore)} onClose={()=>setRestore(null)} onConfirm={()=>{if(restore)setRestored(current=>[...current,restore]);setRestore(null);setToast('Record restored successfully. Original history and attribution were retained.')}} title="Restore Record?" description="The record will return to its active register with historical links and attribution intact." confirmLabel="Restore"/><ConfirmActionDialog open={Boolean(archive)} onClose={()=>setArchive(null)} onConfirm={()=>{if(archive)setArchived(current=>[...current,archive]);setArchive(null);setToast('History record archived. Its original evidence, scores and attribution remain intact.')}} title="Archive History Record?" description="This removes the record from the active register without changing historical scores, evidence, findings or attribution." confirmLabel="Archive Record" destructive/>{toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>}</div>
}

function VariantTable({domain,tab,headers,rows,restored,onRestore,onArchive,onAction,onNavigate}:{domain:string;tab:string;headers:string[];rows:string[][];restored:string[];onRestore:(name:string)=>void;onArchive:(name:string)=>void;onAction:(message:string)=>void;onNavigate:(route:string)=>void}){
  const actionsFor=(row:string[])=>tab==='Archived'?
    [{label:'View Record',kind:'view' as const,onSelect:()=>onAction(`${row[0]} opened in read-only mode.`)},{label:'Export Record',kind:'duplicate' as const,onSelect:()=>onAction(`${row[0]} export prepared.`)},{label:'Restore Record',kind:'restore' as const,onSelect:()=>onRestore(row[0])}]:
    [{label:'View Audit',kind:'view' as const,onSelect:()=>onNavigate('/audits/TRC-WEB-2026-0042')},{label:'View Evidence',kind:'view' as const,onSelect:()=>onNavigate('/evidence')},{label:'View Findings',kind:'view' as const,onSelect:()=>onNavigate('/audits/TRC-WEB-2026-0042/findings')},{label:'View Recommendations',kind:'view' as const,onSelect:()=>onNavigate('/audits/TRC-WEB-2026-0042/recommendations')},...(tab==='Reassessments'?[{label:'Compare with Baseline',kind:'duplicate' as const,onSelect:()=>onNavigate('/audits/TRC-WEB-2026-0042/reassessment')}]:[]),{label:'Generate Report',kind:'duplicate' as const,onSelect:()=>onAction(`${row[0]} report prepared.`)},{label:'Export Record',kind:'duplicate' as const,onSelect:()=>onAction(`${row[0]} export prepared.`)},{label:'Archive Record',kind:'archive' as const,onSelect:()=>onArchive(row[0])}]

  const renderValue=(value:string,row:string[])=>value==='Review'?<Link href={`/evidence/${slugify(row[0])}`} aria-label={`Review ${row[0]}`} className="inline-flex h-8 items-center justify-center rounded-md border border-brand/35 bg-brand-muted px-3 font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Review</Link>:value==='Restore'?<button disabled={restored.includes(row[0])} onClick={()=>onRestore(row[0])} className="rounded-md border border-border px-3 py-1.5 font-semibold text-brand disabled:text-success">{restored.includes(row[0])?'Restored':'Restore'}</button>:value==='View'?<button onClick={()=>onAction(`${row[0]} opened in read-only mode.`)} className="font-semibold text-brand">View</button>:['Active','Completed','Validated','Baseline','Draft','In Progress','Under Review'].includes(value)?<StatusBadge status={value}/>:value

  return <>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[940px] table-fixed text-[11px]">
        <thead><tr className="border-b border-border">{headers.map((header,index)=><th key={index} className="px-3 py-3 text-left font-semibold text-foreground/70">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row,rowIndex)=><tr key={rowIndex} className="h-[60px] border-b border-border last:border-0 hover:bg-muted/30">{row.map((value,columnIndex)=><td key={columnIndex} className="overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 text-muted-foreground">{columnIndex===0?<div className="flex items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-muted"><FileText className="size-3.5 text-brand"/></span><span className="truncate font-semibold text-foreground">{value}</span></div>:renderValue(value,row)}</td>)}<td className="px-2">{domain==='history'?<CrudActionMenu label={`Actions for ${row[0]}`} actions={actionsFor(row)}/>:<Tooltip content={`Actions for ${row[0]}`}><button onClick={()=>onAction(`${row[0]} details opened.`)} aria-label={`Actions for ${row[0]}`} className="rounded-md p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><MoreHorizontal className="size-4"/></button></Tooltip>}</td></tr>)}</tbody>
      </table>
    </div>

    <div className="divide-y divide-border md:hidden">
      {rows.map((row,rowIndex)=>{
        const terminalAction=['Review','Restore','View'].includes(row.at(-1)??'')?row.at(-1):null
        const details=row.slice(1,terminalAction?-1:undefined).slice(0,4)
        return <article key={rowIndex} className="px-4 py-4 first:pt-3">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-muted"><FileText className="size-4 text-brand"/></span>
            <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{row[0]}</h3><p className="mt-0.5 text-[11px] text-muted-foreground">{headers[0]}</p></div>
            {domain==='history'?<CrudActionMenu label={`Actions for ${row[0]}`} actions={actionsFor(row)}/>:<button onClick={()=>onAction(`${row[0]} details opened.`)} aria-label={`Actions for ${row[0]}`} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><MoreHorizontal className="size-4"/></button>}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-muted/35 p-3 text-[11px]">
            {details.map((value,index)=><div key={`${headers[index+1]}-${index}`} className="min-w-0"><dt className="truncate text-muted-foreground">{headers[index+1]}</dt><dd className="mt-1 truncate font-medium text-foreground">{renderValue(value,row)}</dd></div>)}
          </dl>
          <div className="mt-3 flex justify-end">{terminalAction?renderValue(terminalAction,row):<button onClick={()=>domain==='history'?onNavigate('/audits/TRC-WEB-2026-0042'):onAction(`${row[0]} details opened.`)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">View record →</button>}</div>
        </article>
      })}
    </div>
  </>
}

function slugify(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}

function VariantAside({domain,total,stats,chartTitle}:{domain:string;total:string;stats:[string,string][];chartTitle:string}) {
  const data=[{label:'Primary',value:62,color:'oklch(0.64 0.18 40)'},{label:'Secondary',value:24,color:'oklch(0.61 0.13 250)'},{label:'Other',value:14,color:'oklch(0.83 0.05 80)'}]
  const categories=['Website','Operations','Brand','Digital']
  const percentages=[42,31,18,9]
  const widths=[82,65,44,28]
  return <aside className="space-y-4">
    <Card className="p-4"><h3 className="text-xs font-semibold">{domain==='frameworks'?'Framework':'Record'} Overview</h3><div className="my-4 flex justify-center"><div className="relative"><DonutChart data={data} size={98} thickness={14}/><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl">{total}</strong><span className="text-[8px] uppercase text-muted-foreground">Total</span></div></div></div><div className="space-y-2">{stats.map(([label,value])=><StatRow key={label} label={label} value={value}/>)}</div></Card>
    <Card className="p-4"><h3 className="mb-4 text-xs font-semibold">{chartTitle}</h3>{categories.map((category,index)=><Tooltip key={category} content={`${category}: ${percentages[index]}% of records`}><div tabIndex={0} className="mb-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-brand"><div className="mb-1 flex justify-between text-[9px]"><span>{category}</span><span>{percentages[index]}%</span></div><div className="h-1.5 rounded bg-muted"><div className="h-full rounded bg-brand" style={{width:`${widths[index]}%`}}/></div></div></Tooltip>)}</Card>
    <Card className="p-4"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-success"/><h3 className="text-xs font-semibold">Governance Ready</h3></div><p className="mt-2 text-[10px] leading-4 text-muted-foreground">Every record preserves user attribution, status and its original audit link.</p></Card>
  </aside>
}

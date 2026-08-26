'use client'

import {
  Activity, AlertTriangle, CheckCircle2, ClipboardCheck, Download, Gauge, Image as ImageIcon,
  MoreHorizontal, Search, Sparkles, TrendingUp, Upload,
} from 'lucide-react'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuditHeader } from './audit-header'
import { AuditTabs } from './audit-tabs'
import { Card, StatRow } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { DonutChart } from '@/components/charts/audit-type-chart'
import { usePathname } from 'next/navigation'
import { getAuditTypeFromAuditId } from '@/config/audit-types'
import { createCollectionAreas } from '@/data/mock/audit-workflows'
import { auditWorkspaceMeta } from '@/data/mock/audit-workflows'
import { evidenceFindings, evidenceRecommendations } from '@/data/mock/evidence-workflow'
import { AddEvidenceDialog, type CreatedEvidenceItem } from '@/components/evidence/add-evidence-dialog'
import { Tooltip } from '@/components/ui/tooltip'
import { useState } from 'react'
import type { EvidenceWorkflowContext } from '@/types/evidence'
import { ConfirmActionDialog, CrudActionMenu, CrudFormDialog, CrudToast } from '@/components/ui/crud'
import { ReassessmentOverview } from '@/components/reassessments/reassessment-overview'

export type AuditSection = 'collection' | 'findings' | 'recommendations' | 'evidence' | 'technical-details' | 'reassessment' | 'activity'

const sectionCopy: Record<AuditSection, { title: string; description: string }> = {
  collection: { title: 'Collection', description: 'Review collection progress across all areas in this assessment.' },
  findings: { title: 'Findings', description: 'Review identified issues, observations and supporting evidence.' },
  recommendations: { title: 'Recommendations', description: 'Prioritised actions generated from this audit’s findings.' },
  evidence: { title: 'Evidence', description: 'All evidence collected and linked to this audit.' },
  'technical-details': { title: 'Technical Details', description: 'Technical diagnostics and performance data captured during the audit.' },
  reassessment: { title: 'Reassessment', description: 'Track what changed across audit cycles, measure improvement, and prove impact over time.' },
  activity: { title: 'Activity', description: 'A complete, attributable timeline of changes to this audit.' },
}

const collectionRows = [
  ['Website Structure & Navigation', '6 of 6', 'Complete', 'Alex Reed', '20 Aug 2026'],
  ['Content & Messaging', '4 of 5', 'In Progress', 'Thelma Dube', '20 Aug 2026'],
  ['Visual Design & Brand', '3 of 3', 'Complete', 'Alex Reed', '19 Aug 2026'],
  ['Performance & Technical', '2 of 4', 'In Progress', 'Alex Reed', '20 Aug 2026'],
  ['SEO & Discoverability', '2 of 2', 'Complete', 'Thelma Dube', '18 Aug 2026'],
  ['Accessibility', '1 of 2', 'In Progress', 'Alex Reed', '19 Aug 2026'],
  ['Security & Compliance', '1 of 2', 'Not Started', '—', '—'],
  ['Analytics & Tracking', '0 of 1', 'Not Started', '—', '—'],
]

const findingRows = [
  ['Critical pages load slowly on mobile', 'Performance', 'High', 'Open', 'Homepage, Work', '20 Aug 2026'],
  ['Inconsistent heading hierarchy', 'Accessibility', 'Medium', 'Open', '8 pages', '20 Aug 2026'],
  ['Missing meta descriptions', 'SEO', 'Medium', 'In Progress', '12 pages', '19 Aug 2026'],
  ['Primary CTA lacks contrast', 'Visual Design', 'High', 'Open', 'Homepage', '19 Aug 2026'],
  ['Navigation label is ambiguous', 'Navigation', 'Low', 'Accepted', 'Header', '18 Aug 2026'],
  ['Analytics events not configured', 'Analytics', 'High', 'Open', 'Site-wide', '18 Aug 2026'],
  ['Oversized image assets', 'Performance', 'Medium', 'In Progress', 'Portfolio', '17 Aug 2026'],
]

const recommendationRows = [
  ['Optimise above-the-fold assets', 'Performance', 'High', 'High', 'In Progress', 'Alex Reed'],
  ['Correct heading structure site-wide', 'Accessibility', 'Medium', 'Medium', 'Planned', 'Thelma Dube'],
  ['Create unique metadata for core pages', 'SEO', 'Medium', 'High', 'Planned', 'Alex Reed'],
  ['Increase primary button contrast', 'Visual Design', 'High', 'Low', 'Approved', 'Thelma Dube'],
  ['Configure conversion tracking events', 'Analytics', 'High', 'Medium', 'Draft', 'Alex Reed'],
]

const initialEvidenceRows = [
  ['Homepage mobile test', 'Screenshot', 'Performance', 'Alex Reed', '20 Aug 2026', 'Validated'],
  ['Page Load Test Report', 'Report', 'Performance', 'Alex Reed', '20 Aug 2026', 'Needs Review'],
  ['Heading structure export', 'File', 'Accessibility', 'Thelma Dube', '20 Aug 2026', 'Validated'],
  ['Homepage CTA recording', 'Video', 'Visual Design', 'Thelma Dube', '19 Aug 2026', 'Validated'],
  ['Search metadata crawl', 'Data', 'SEO', 'Alex Reed', '19 Aug 2026', 'Needs Review'],
  ['Analytics configuration', 'Screenshot', 'Analytics', 'Alex Reed', '18 Aug 2026', 'Validated'],
]

export function AuditSectionView({ section }: { section: AuditSection }) {
  const pathname = usePathname()
  const auditId = pathname.split('/')[2] || 'TRC-WEB-2026-0042'
  const auditType = getAuditTypeFromAuditId(auditId)
  const auditMeta = auditWorkspaceMeta[auditId]
  const [addEvidenceOpen, setAddEvidenceOpen] = useState(false)
  const [createdRows, setCreatedRows] = useState<string[][]>([])
  const [toast, setToast] = useState(false)
  const [message, setMessage] = useState('')
  const [findings, setFindings] = useState<string[][]>(() => findingRows.map(row => [...row]))
  const [recommendations, setRecommendations] = useState<string[][]>(() => recommendationRows.map(row => [...row]))
  const [editor, setEditor] = useState<{ kind: 'finding'|'recommendation'; index: number|null }|null>(null)
  const [lifecycle, setLifecycle] = useState<{ kind: 'finding'|'recommendation'; index: number; restore: boolean }|null>(null)
  const copy = sectionCopy[section]
  const finding = evidenceFindings.find(item => item.auditId === auditId)
  const recommendation = evidenceRecommendations.find(item => item.auditId === auditId)
  const evidenceContext: EvidenceWorkflowContext = {
    organisationId: auditType.id === 'operational-flow' ? 'himark' : 'oak-pixel',
    organisationName: auditType.id === 'operational-flow' ? 'HIMARK' : 'Oak & Pixel',
    auditId,
    auditName: auditMeta?.name || `${auditType.name} assessment`,
    assessmentId: auditType.id === 'operational-flow' ? 'r01' : 'baseline',
    assessmentName: auditType.id === 'operational-flow' ? 'Reassessment 01' : 'Baseline Assessment',
    auditTypeId: auditType.id,
    ...(section === 'findings' && finding ? { findingId: finding.id, findingName: finding.name } : {}),
    ...(section === 'recommendations' && recommendation ? { recommendationId: recommendation.id, recommendationName: recommendation.name } : {}),
  }
  const addCreatedEvidence = (item: CreatedEvidenceItem) => {
    setCreatedRows(rows => [[item.name, item.type, 'Linked record', item.uploadedBy, item.uploadedOn, item.status], ...rows])
    setToast(true)
    window.setTimeout(() => setToast(false), 3500)
  }
  return (
    <div>
      <AuditHeader />
      <AuditTabs />
      {section !== 'reassessment' && <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{copy.title}</h2><p className="mt-1 text-xs text-muted-foreground">{copy.description}</p></div>
        <SectionAction section={section} onAddEvidence={() => setAddEvidenceOpen(true)} onAddRecord={() => setEditor({kind:section === 'recommendations' ? 'recommendation':'finding',index:null})} onSimpleAction={()=>setMessage(section==='collection'?'Assessment resumed at Performance & Technical.':`${copy.title} export prepared.`)} />
      </div>}
      {section === 'technical-details' ? <TechnicalDetails /> : section === 'reassessment' ? <ReassessmentOverview /> : section === 'activity' ? <ActivityView /> : <StandardSection section={section} typeId={auditType.id} collectionAreas={auditType.collectionAreas} evidenceRows={[...createdRows, ...initialEvidenceRows]} findingRecords={findings} recommendationRecords={recommendations} onEdit={(kind,index)=>setEditor({kind,index})} onDuplicate={(kind,index)=>{const setter=kind==='finding'?setFindings:setRecommendations;const source=(kind==='finding'?findings:recommendations)[index];setter(current=>[[`${source[0]} (Copy)`,...source.slice(1)],...current]);setMessage(`${kind==='finding'?'Finding':'Recommendation'} duplicated.`)}} onLifecycle={(kind,index,restore)=>setLifecycle({kind,index,restore})} onStatus={(kind,index,status)=>{const statusIndex=kind==='finding'?3:4;(kind==='finding'?setFindings:setRecommendations)(current=>current.map((row,rowIndex)=>rowIndex===index?row.map((cell,cellIndex)=>cellIndex===statusIndex?status:cell):row));setMessage(`Status changed to ${status}.`)}} />}
      <AddEvidenceDialog open={addEvidenceOpen} onClose={() => setAddEvidenceOpen(false)} context={evidenceContext} onSuccess={addCreatedEvidence} />
      <CrudFormDialog open={Boolean(editor)} onClose={()=>setEditor(null)} onSubmit={(values)=>{if(!editor)return;const current=editor.kind==='finding'?findings:recommendations;const existing=editor.index===null?undefined:current[editor.index];const next=editor.kind==='finding'?[values.title,values.area,values.severity,values.status,values.affected,existing?.[5]||'Just now']:[values.title,values.area,values.priority,values.effort,values.status,values.owner];const setter=editor.kind==='finding'?setFindings:setRecommendations;setter(rows=>editor.index===null?[next,...rows]:rows.map((row,index)=>index===editor.index?next:row));setMessage(`${editor.kind==='finding'?'Finding':'Recommendation'} ${editor.index===null?'created':'updated'} successfully.`)}} title={`${editor?.index===null?'Add':'Edit'} ${editor?.kind==='recommendation'?'Recommendation':'Finding'}`} description="Changes are attributed to your authenticated account and written to the audit activity log." submitLabel={editor?.index===null?'Create record':'Save changes'} fields={editor ? editor.kind==='finding' ? (()=>{const row=editor.index===null?['','Performance','Medium','Open','','']:findings[editor.index];return [{name:'title',label:'Title',value:row[0],required:true},{name:'area',label:'Category / area',value:row[1],required:true},{name:'severity',label:'Severity',value:row[2],type:'select' as const,options:['Low','Medium','High','Critical']},{name:'status',label:'Status',value:row[3],type:'select' as const,options:['Open','In Progress','Resolved','Accepted']},{name:'affected',label:'Affected scope',value:row[4]},{name:'description',label:'Observed condition, impact and root cause',value:'',type:'textarea' as const}]} )() : (()=>{const row=editor.index===null?['','Performance','Medium','Medium','Not Started','Alex Reed']:recommendations[editor.index];return [{name:'title',label:'Recommendation',value:row[0],required:true},{name:'area',label:'Area',value:row[1],required:true},{name:'priority',label:'Priority',value:row[2],type:'select' as const,options:['Low','Medium','High','Critical']},{name:'effort',label:'Effort',value:row[3],type:'select' as const,options:['Low','Medium','High']},{name:'status',label:'Status',value:row[4],type:'select' as const,options:['Not Started','In Progress','Completed','Deferred','Rejected']},{name:'owner',label:'Owner',value:row[5],type:'select' as const,options:['Alex Reed','Thelma Dube','Maya Khan']},{name:'description',label:'Expected impact and target metric',value:'',type:'textarea' as const}]} )() : []}/>
      <ConfirmActionDialog open={Boolean(lifecycle)} onClose={()=>setLifecycle(null)} onConfirm={()=>{if(!lifecycle)return;const statusIndex=lifecycle.kind==='finding'?3:4;const setter=lifecycle.kind==='finding'?setFindings:setRecommendations;setter(current=>current.map((row,index)=>index===lifecycle.index?row.map((cell,cellIndex)=>cellIndex===statusIndex?(lifecycle.restore?(lifecycle.kind==='finding'?'Open':'Not Started'):'Archived'):cell):row));setMessage(lifecycle.restore?'Record restored successfully.':'Record archived with its audit history preserved.');setLifecycle(null)}} title={lifecycle?.restore?'Restore Record?':'Archive Record?'} description={lifecycle?.restore?'The record will return to the active audit workspace.':'The record and all linked evidence will remain in the audit trail and become read-only.'} confirmLabel={lifecycle?.restore?'Restore':'Archive'} destructive={!lifecycle?.restore}/>
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-lg border border-success/30 bg-card px-4 py-3 shadow-xl"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success"/><div><p className="text-xs font-semibold">Evidence added</p><p className="mt-0.5 text-[10px] text-muted-foreground">The evidence is linked to this {section === 'findings' ? 'finding' : section === 'recommendations' ? 'recommendation' : 'audit'}.</p></div></div>}
      {message&&<CrudToast message={message} onClose={()=>setMessage('')}/>} 
    </div>
  )
}

function SectionAction({ section, onAddEvidence, onAddRecord, onSimpleAction }: { section: AuditSection; onAddEvidence: () => void; onAddRecord: () => void; onSimpleAction:()=>void }) {
  if (section === 'collection') return <button onClick={onSimpleAction} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"><ClipboardCheck className="size-3.5" /> Resume Assessment</button>
  if (section==='findings'||section==='recommendations') return <div className="flex gap-2"><button onClick={onAddEvidence} className="hidden h-9 items-center gap-2 rounded-md border border-border px-4 text-xs font-semibold sm:inline-flex"><Upload className="size-3.5" /> Add Evidence</button><button onClick={onAddRecord} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"><Sparkles className="size-3.5" /> Add {section==='findings'?'Finding':'Recommendation'}</button></div>
  if (section==='evidence') return <button onClick={onAddEvidence} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"><Upload className="size-3.5" /> Add Evidence</button>
  if (section === 'reassessment') return <button onClick={onSimpleAction} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"><TrendingUp className="size-3.5" /> Start Reassessment</button>
  if (section === 'activity') return <button onClick={onSimpleAction} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-xs font-semibold"><Download className="size-3.5" /> Export Activity</button>
  if (section === 'technical-details') return <button onClick={onSimpleAction} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-xs font-semibold"><Download className="size-3.5" /> Export Technical Report</button>
  return null
}

function StandardSection({ section, typeId, collectionAreas, evidenceRows, findingRecords, recommendationRecords, onEdit, onDuplicate, onLifecycle, onStatus }: { section: AuditSection; typeId:string; collectionAreas:readonly string[]; evidenceRows:string[][]; findingRecords:string[][]; recommendationRecords:string[][]; onEdit:(kind:'finding'|'recommendation',index:number)=>void; onDuplicate:(kind:'finding'|'recommendation',index:number)=>void; onLifecycle:(kind:'finding'|'recommendation',index:number,restore:boolean)=>void; onStatus:(kind:'finding'|'recommendation',index:number,status:string)=>void }) {
  const metrics = section === 'collection'
    ? [['76%', 'Overall progress'], ['19', 'Completed'], ['4', 'In progress'], ['2', 'Not started'], ['3', 'Issues']]
    : section === 'findings'
      ? [['9', 'Total findings'], ['3', 'High severity'], ['4', 'Open'], ['3', 'In progress'], ['2', 'Resolved']]
      : section === 'recommendations'
        ? [['9', 'Recommendations'], ['4', 'High priority'], ['2', 'Approved'], ['3', 'In progress'], ['4', 'Planned']]
        : [['48', 'Evidence items'], ['32', 'Validated'], ['11', 'Needs review'], ['5', 'Archived'], ['2.48 GB', 'Storage used']]

  return <>
    <Card className="mb-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden md:grid-cols-5 md:divide-y-0">{metrics.map(([value, label], index) => <div key={label} className="px-4 py-3"><p className={`text-lg font-semibold ${index === 0 ? 'text-brand' : ''}`}>{value}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p></div>)}</Card>
    <div className="mb-4 flex flex-wrap gap-2"><div className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-md border border-border px-3"><Search className="size-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Search {section}…</span></div>{['All areas', 'All statuses', 'All owners'].map(x => <button key={x} className="h-9 rounded-md border border-border px-3 text-xs text-muted-foreground">{x}⌄</button>)}</div>
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_255px]">
      <Card className="min-w-0 overflow-hidden">{section === 'collection' ? <CollectionTable typeId={typeId} areas={collectionAreas} /> : section === 'findings' ? <FindingsTable typeId={typeId} rows={findingRecords} onEdit={index=>onEdit('finding',index)} onDuplicate={index=>onDuplicate('finding',index)} onLifecycle={(index,restore)=>onLifecycle('finding',index,restore)} onStatus={(index,status)=>onStatus('finding',index,status)} /> : section === 'recommendations' ? <RecommendationsTable rows={recommendationRecords} onEdit={index=>onEdit('recommendation',index)} onDuplicate={index=>onDuplicate('recommendation',index)} onLifecycle={(index,restore)=>onLifecycle('recommendation',index,restore)} onStatus={(index,status)=>onStatus('recommendation',index,status)} /> : <EvidenceTable rows={evidenceRows} />}</Card>
      <StandardAside section={section} />
    </div>
  </>
}

function CollectionTable({typeId,areas}:{typeId:string;areas:readonly string[]}) {
  const [rows,setRows]=useState(()=>createCollectionAreas(typeId,areas).map(item=>[item.area,`${item.progress}% · ${item.items}`,item.status,`${item.issues} issues · ${item.source}`,item.updated]))
  const [editing,setEditing]=useState<number|null>(null);const [resetting,setResetting]=useState<number|null>(null);const [toast,setToast]=useState('')
  return <><SimpleTable headers={['Collection Area', 'Progress / Items', 'Status', 'Issues / Source', 'Last Updated', '']} rows={rows} firstIcon={<ClipboardCheck className="size-4 text-brand" />} badgeColumns={[2]} actions={(row,index)=>[{label:'View / Edit Collection',kind:'edit',onSelect:()=>setEditing(index)},{label:'Attach Evidence',onSelect:()=>setToast(`Evidence workflow opened for ${row[0]}.`)},{label:row[2]==='Complete'?'Reopen Area':'Mark Complete',onSelect:()=>{setRows(current=>current.map((item,rowIndex)=>rowIndex===index?item.map((cell,cellIndex)=>cellIndex===2?(row[2]==='Complete'?'In Progress':'Complete'):cell):item));setToast(`Collection area ${row[2]==='Complete'?'reopened':'completed'}.`)}},{label:'Reset Collection Area',kind:'delete',onSelect:()=>setResetting(index)}]} /><CrudFormDialog open={editing!==null} onClose={()=>setEditing(null)} onSubmit={values=>{setRows(current=>current.map((row,index)=>index===editing?[values.area,values.progress,values.status,values.notes,'Just now']:row));setToast('Collection area updated.')}} title="Edit Collection Area" description="Update manual values, status, notes and reviewer assignment." fields={editing!==null?[{name:'area',label:'Collection area',value:rows[editing][0],required:true},{name:'progress',label:'Progress / items',value:rows[editing][1]},{name:'status',label:'Status',value:rows[editing][2],type:'select',options:['Not Started','In Progress','Complete']},{name:'reviewer',label:'Reviewer',value:'Alex Reed',type:'select',options:['Alex Reed','Thelma Dube','Maya Khan']},{name:'notes',label:'Notes / source',value:rows[editing][3],type:'textarea'}]:[]}/><ConfirmActionDialog open={resetting!==null} onClose={()=>setResetting(null)} onConfirm={()=>{setRows(current=>current.map((row,index)=>index===resetting?[row[0],'0% · 0 items','Not Started','0 issues · Manual','Just now']:row));setResetting(null);setToast('Collection area reset. The action was added to activity.')}} title="Reset Collection Area?" description="Manual progress and completion state will reset. Linked evidence remains preserved." confirmLabel="Reset Area" destructive/>{toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>}</>
}

function FindingsTable({typeId,rows,onEdit,onDuplicate,onLifecycle,onStatus}:{typeId:string;rows:string[][];onEdit:(index:number)=>void;onDuplicate:(index:number)=>void;onLifecycle:(index:number,restore:boolean)=>void;onStatus:(index:number,status:string)=>void}) {
  const areas:Record<string,string[]>={website:['Performance','SEO','Accessibility','Security','Content'],brand:['Visual Identity','Messaging','Typography','Colour','Touchpoints'], 'digital-presence':['Search','Social','Reputation','Listings','Cross-Channel'],'operational-flow':['Efficiency','Controls','Handoffs','Systems','Ownership','Data'],'customer-experience':['Customer Journey','Touchpoints','Voice of Customer','Service Consistency','Service Recovery'],people:['Workforce Planning','Organisation Design','Talent Acquisition','Performance & Capability','Engagement & Culture'],intelligence:['Source Coverage','Data Quality','Information Governance','Analysis Capability','Decision Integration']}
  const displayRows=rows.map((row,index)=>[row[0],areas[typeId]?.[index%(areas[typeId]?.length||1)]||row[1],...row.slice(2)])
  return <SimpleTable headers={['Finding', 'Area', 'Severity', 'Status', 'Affected', 'Discovered', '']} rows={displayRows} firstIcon={<AlertTriangle className="size-4 text-brand" />} badgeColumns={[2,3]} actions={(row,index)=>row[3]==='Archived'?[{label:'View read-only',kind:'view',onSelect:()=>onEdit(index)},{label:'Restore Finding',kind:'restore',onSelect:()=>onLifecycle(index,true)}]:[{label:'View / Edit Finding',kind:'edit',onSelect:()=>onEdit(index)},{label:'Duplicate Finding',kind:'duplicate',onSelect:()=>onDuplicate(index)},{label:row[3]==='Resolved'?'Reopen Finding':'Mark Resolved',onSelect:()=>onStatus(index,row[3]==='Resolved'?'Open':'Resolved')},{label:'Archive Finding',kind:'archive',onSelect:()=>onLifecycle(index,false)}]} />
}

function RecommendationsTable({rows,onEdit,onDuplicate,onLifecycle,onStatus}:{rows:string[][];onEdit:(index:number)=>void;onDuplicate:(index:number)=>void;onLifecycle:(index:number,restore:boolean)=>void;onStatus:(index:number,status:string)=>void}) {
  return <SimpleTable headers={['Recommendation', 'Area', 'Priority', 'Effort', 'Status', 'Owner', '']} rows={rows} firstIcon={<Sparkles className="size-4 text-brand" />} badgeColumns={[2,4]} actions={(row,index)=>row[4]==='Archived'?[{label:'View read-only',kind:'view',onSelect:()=>onEdit(index)},{label:'Restore Recommendation',kind:'restore',onSelect:()=>onLifecycle(index,true)}]:[{label:'View / Edit',kind:'edit',onSelect:()=>onEdit(index)},{label:'Duplicate Recommendation',kind:'duplicate',onSelect:()=>onDuplicate(index)},{label:'Mark In Progress',onSelect:()=>onStatus(index,'In Progress')},{label:'Mark Completed',onSelect:()=>onStatus(index,'Completed')},{label:'Defer',onSelect:()=>onStatus(index,'Deferred')},{label:'Archive Recommendation',kind:'archive',onSelect:()=>onLifecycle(index,false)}]} />
}

function EvidenceTable({rows}:{rows:string[][]}) {
  return <SimpleTable headers={['Evidence', 'Type', 'Linked Area', 'Uploaded By', 'Uploaded On', 'Status', '']} rows={rows} firstIcon={<ImageIcon className="size-4 text-brand" />} badgeColumns={[5]} />
}

function SimpleTable({ headers, rows, firstIcon, badgeColumns = [], actions }: { headers: string[]; rows: string[][]; firstIcon: React.ReactNode; badgeColumns?: number[]; actions?: (row:string[],index:number)=>React.ComponentProps<typeof CrudActionMenu>['actions'] }) {
  return <>
    <div className="hidden w-full overflow-x-auto md:block"><table className="w-full min-w-[760px] text-[11px]"><thead><tr className="border-b border-border">{headers.map((h,i)=><th key={i} className="px-3 py-3 text-left font-semibold text-foreground/70">{h}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={`${row[0]}-${ri}`} className="h-[54px] border-b border-border last:border-0 hover:bg-muted/30">{row.map((cell,ci)=><td key={ci} className="whitespace-nowrap px-3 py-2 text-muted-foreground">{ci === 0 ? <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-md bg-brand-muted">{firstIcon}</span><span className="font-semibold text-foreground">{cell}</span></div> : badgeColumns.includes(ci) ? <StatusBadge status={cell} /> : cell}</td>)}<td className="px-2">{actions?<CrudActionMenu actions={actions(row,ri)}/>:<MoreHorizontal className="size-4 text-muted-foreground" />}</td></tr>)}</tbody></table></div>
    <div className="divide-y divide-border md:hidden">{rows.map((row,ri)=><article key={`${row[0]}-mobile-${ri}`} className="p-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-muted">{firstIcon}</span><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">{row[0]}</p><div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">{row.slice(1).map((cell,index)=>{const column=index+1;return <div key={`${headers[column]}-${index}`}><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{headers[column]}</p><div className="mt-1 text-[10px] text-foreground">{badgeColumns.includes(column)?<StatusBadge status={cell}/>:cell}</div></div>})}</div></div><div className="shrink-0">{actions?<CrudActionMenu actions={actions(row,ri)}/>:<MoreHorizontal className="size-4 text-muted-foreground" />}</div></div></article>)}</div>
  </>
}

function StandardAside({ section }: { section: AuditSection }) {
  const title = section === 'collection' ? 'Collection Overview' : section === 'findings' ? 'Findings Summary' : section === 'recommendations' ? 'Recommendation Summary' : 'Evidence Summary'
  const data = [{label:'Complete',value:64,color:'oklch(0.58 0.17 150)'},{label:'In progress',value:24,color:'oklch(0.64 0.18 40)'},{label:'Remaining',value:12,color:'oklch(0.88 0.02 250)'}]
  return <aside className="space-y-4"><Card className="p-4"><h3 className="text-sm font-semibold">{title}</h3><div className="my-4 flex justify-center"><div className="relative"><DonutChart data={data} size={108} thickness={15} /><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl">{section === 'evidence' ? '48' : section === 'findings' ? '9' : '76%'}</strong><span className="text-[9px] text-muted-foreground">TOTAL</span></div></div></div><div className="space-y-2"><StatRow label="Completed" value="19" valueClassName="text-success" /><StatRow label="In progress" value="4" /><StatRow label="Needs attention" value="3" valueClassName="text-brand" /></div></Card><Card className="p-4"><h3 className="mb-4 text-sm font-semibold">By Area</h3>{['Performance','SEO','Accessibility','Design'].map((x,i)=><Tooltip key={x} content={`${x}: ${[82,74,63,58][i]}%`}><div tabIndex={0} className="mb-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-brand"><div className="mb-1 flex justify-between text-[10px]"><span>{x}</span><span>{[82,74,63,58][i]}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{width:`${[82,74,63,58][i]}%`}} /></div></div></Tooltip>)}</Card></aside>
}

function TechnicalDetails() {
  const scores = [['Performance','68'],['SEO','72'],['Accessibility','81'],['Best Practices','88'],['Security','62']]
  const vitals = [['Largest Contentful Paint','3.2 s','Needs Improvement'],['Interaction to Next Paint','246 ms','Needs Improvement'],['Cumulative Layout Shift','0.08','Good'],['First Contentful Paint','1.8 s','Good'],['Time to First Byte','860 ms','Needs Improvement']]
  return <><div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">{scores.map(([l,v])=><Card key={l} className="p-4"><div className="mb-2 flex items-center gap-2"><Gauge className="size-4 text-brand"/><span className="text-[11px] text-muted-foreground">{l}</span></div><p className="text-2xl font-semibold">{v}<span className="text-xs text-muted-foreground">/100</span></p></Card>)}</div><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_255px]"><div className="space-y-4"><Card><div className="border-b border-border px-4 pt-4"><div className="flex gap-6 text-xs"><span className="border-b-2 border-brand pb-3 font-semibold text-brand">Core Web Vitals</span><span>Resources</span><span>SEO</span><span>Accessibility</span><span>Security</span></div></div><SimpleTable headers={['Metric','Result','Status','Recommendation','']} rows={vitals.map(r=>[...r,r[2]==='Good'?'No action required':'Optimisation recommended'])} firstIcon={<Gauge className="size-4 text-brand"/>} badgeColumns={[2]} /></Card><Card className="p-4"><h3 className="mb-4 text-sm font-semibold">Resources Summary</h3><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[['Page weight','4.8 MB'],['Requests','96'],['JavaScript','1.7 MB'],['Images','2.3 MB']].map(x=><div key={x[0]}><p className="text-[10px] text-muted-foreground">{x[0]}</p><p className="mt-1 text-lg font-semibold">{x[1]}</p></div>)}</div></Card></div><TechnicalAside /></div></>
}

function TechnicalAside(){return <aside className="space-y-4"><Card className="p-4"><h3 className="text-sm font-semibold">Technical Score</h3><div className="my-4 flex justify-center"><div className="relative"><DonutChart data={[{label:'Score',value:74,color:'oklch(0.64 0.18 40)'},{label:'Gap',value:26,color:'oklch(0.9 0.01 250)'}]} size={110} thickness={14}/><strong className="absolute inset-0 flex items-center justify-center text-2xl">74</strong></div></div><p className="text-center text-[11px] text-muted-foreground">Good foundation with key opportunities</p></Card><Card className="p-4"><h3 className="mb-3 text-sm font-semibold">Top Issues</h3>{['Slow server response','Unused JavaScript','Missing security headers','Large image payloads'].map((x,i)=><div key={x} className="flex gap-2 border-b border-border py-2.5 last:border-0"><span className="text-xs font-semibold text-brand">0{i+1}</span><span className="text-[11px]">{x}</span></div>)}</Card><Card className="p-4"><h3 className="mb-3 text-sm font-semibold">Security</h3><StatRow label="HTTPS" value="Enabled" valueClassName="text-success"/><div className="mt-2"><StatRow label="Headers" value="3 missing" valueClassName="text-brand"/></div></Card></aside>}

function ActivityView(){
 const events=[['Alex Reed completed the assessment','20 Aug 2026 · 10:42 AM','Completed'],['Thelma Dube approved the recommendation','20 Aug 2026 · 10:31 AM','Approved'],['Alex Reed updated Finding TRC-OF-014','20 Aug 2026 · 10:18 AM','Finding'],['Thelma Dube uploaded Page Load Test Report','20 Aug 2026 · 09:52 AM','Evidence'],['Alex Reed added a recommendation','19 Aug 2026 · 04:16 PM','Recommendation'],['System scheduled reassessment for 90 days','19 Aug 2026 · 04:05 PM','System'],['Alex Reed started the assessment','15 Aug 2026 · 09:10 AM','Started'],['Alex Reed created the audit','15 Aug 2026 · 09:02 AM','Created']]
 return <><div className="mb-4 flex flex-wrap gap-2"><div className="flex h-9 min-w-64 flex-1 items-center gap-2 rounded-md border border-border px-3"><Search className="size-3.5 text-muted-foreground"/><span className="text-xs text-muted-foreground">Search activity…</span></div>{['All activity','All users','Any time'].map(x=><button key={x} className="h-9 rounded-md border border-border px-3 text-xs">{x}⌄</button>)}</div><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_255px]"><Card className="p-5"><div className="relative ml-3 border-l border-border pl-7">{events.map((e,i)=><div key={e[0]} className="relative border-b border-border py-4 first:pt-0 last:border-0"><span className="absolute -left-[39px] top-4 flex size-6 items-center justify-center rounded-full border border-border bg-background"><Activity className="size-3 text-brand"/></span><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold">{e[0]}</p><p className="mt-1 text-[11px] text-muted-foreground">{e[1]}</p></div><StatusBadge status={e[2]}/></div></div>)}</div></Card><aside className="space-y-4"><Card className="p-4"><h3 className="mb-4 text-sm font-semibold">Activity Overview</h3><div className="space-y-2"><StatRow label="Total activity" value="42"/><StatRow label="People involved" value="2"/><StatRow label="System events" value="6"/><StatRow label="Last updated" value="10:42 AM"/></div></Card><Card className="p-4"><h3 className="mb-4 text-sm font-semibold">By Type</h3><div className="flex justify-center"><DonutChart data={[{label:'Changes',value:18,color:'oklch(0.64 0.18 40)'},{label:'Evidence',value:11,color:'oklch(0.62 0.13 250)'},{label:'System',value:7,color:'oklch(0.75 0.12 70)'},{label:'Review',value:6,color:'oklch(0.58 0.17 150)'}]} size={100} thickness={14}/></div></Card><Card className="p-4"><h3 className="mb-3 text-sm font-semibold">Recent Activity</h3><p className="text-[11px] text-muted-foreground">8 events today · 14 this week</p></Card></aside></div></>
}

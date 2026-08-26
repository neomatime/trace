'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Globe2, Monitor, Network, Plus, Shield, ShieldCheck } from 'lucide-react'
import { PageHeader, PrimaryButton } from '@/components/layout/page-header'
import { DonutChart, DonutLegend } from '@/components/charts/audit-type-chart'
import { Card, Panel, StatRow } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { PageTabs } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { ConfirmActionDialog, CrudActionMenu, CrudEmptyState, CrudFormDialog, CrudToast } from '@/components/ui/crud'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'

const TABS = ['All Audits', 'Active', 'Completed', 'Reassessment Due', 'Archived']

const auditRows = [
  { id: 'TRC-WEB-2026-0042', name: 'Oak & Pixel Website — Aug 2026', icon: 'monitor', type: 'Website Audit', scope: 'oakandpixel.co.za', status: 'Completed', score: 72, updated: '20 May 2024, 10:42 AM', owner: 'Alex Reed', next: '20 Aug 2024', due: 'In 92 days' },
  { id: 'TRC-BRN-2026-0021', name: 'Oak & Pixel Brand — Aug 2026', icon: 'shield', type: 'Brand Consistency Audit', scope: 'Oak & Pixel', status: 'In Progress', score: null, updated: '20 May 2024, 09:18 AM', owner: 'Alex Reed', next: '—', due: '' },
  { id: 'TRC-DIG-2026-0018', name: 'Oak & Pixel Digital — Q3 2026', icon: 'globe', type: 'Digital Presence Audit', scope: 'Oak & Pixel', status: 'Completed', score: 81, updated: '12 May 2024, 03:21 PM', owner: 'Alex Reed', next: '12 Aug 2024', due: 'In 84 days' },
  { id: 'TRC-OF-2026-0007', name: 'Purchase-to-Pay — Baseline', icon: 'network', type: 'Operational Flow Audit', scope: 'HIMARK Procurement', status: 'In Progress', score: null, updated: '19 May 2024, 11:05 AM', owner: 'Alex Reed', next: '—', due: '' },
  { id: 'TRC-OF-2026-0006', name: 'Client Onboarding — Baseline', icon: 'network', type: 'Operational Flow Audit', scope: 'HIMARK Client Success', status: 'In Progress', score: null, updated: '18 May 2024, 04:33 PM', owner: 'Thelma Mothiba', next: '—', due: '' },
  { id: 'TRC-WEB-2026-0003', name: 'Oak & Pixel Website — Feb 2026', icon: 'monitor', type: 'Website Audit', scope: 'oakandpixel.co.za', status: 'Completed', score: 64, updated: '20 Feb 2026, 02:14 PM', owner: 'Alex Reed', next: '20 May 2026', due: 'Due in 10 days' },
  { id: 'TRC-CUS-2026-0002', name: 'HR Policy Review — Baseline', icon: 'badge', type: 'Custom Audit', scope: 'HIMARK', status: 'Completed', score: 76, updated: '11 Feb 2026, 10:11 AM', owner: 'Alex Reed', next: '11 May 2026', due: 'In 1 day' },
  { id: 'TRC-SEC-2026-0001', name: 'IT Security Posture — Baseline', icon: 'shield-check', type: 'Digital Presence Audit', scope: 'HIMARK', status: 'Completed', score: 85, updated: '05 Feb 2026, 08:44 AM', owner: 'Alex Reed', next: '05 May 2026', due: 'In 5 days' },
]

const typeChart = [
  { label: 'Website Audit', value: 2, display: '2 (25%)', color: 'oklch(0.58 0.2 35)' },
  { label: 'Digital Presence Audit', value: 2, display: '2 (25%)', color: 'oklch(0.64 0.12 250)' },
  { label: 'Brand Consistency Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.72 0.12 65)' },
  { label: 'Operational Flow Audit', value: 2, display: '2 (25%)', color: 'oklch(0.76 0.14 50)' },
  { label: 'Custom Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.76 0.03 250)' },
]

export function AuditsView() {
  const router = useRouter()
  const [rows, setRows] = useState(() => auditRows.map(audit => ({ ...audit, archived: false })))
  const [tab, setTab] = useState('All Audits')
  const [query, setQuery] = useState('')
  const [organisation, setOrganisation] = useState('All Organisations')
  const [auditType, setAuditType] = useState('All Audit Types')
  const [status, setStatus] = useState('All Statuses')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; restore: boolean } | null>(null)
  const [toast, setToast] = useState('')
  const [selected,setSelected]=useState<string[]>([])
  const [sort,setSort]=useState('Recently updated')

  const filtered = rows.filter((audit) => {
    const q = query.toLowerCase()
    return (!q || `${audit.name} ${audit.id} ${audit.scope}`.toLowerCase().includes(q))
      && (organisation === 'All Organisations' || audit.scope.includes(organisation))
      && (auditType === 'All Audit Types' || audit.type === auditType)
      && (status === 'All Statuses' || audit.status === status)
      && (tab === 'Archived' ? audit.archived : !audit.archived)
      && (tab === 'All Audits' || tab === 'Archived' || (tab === 'Active' && audit.status === 'In Progress') || (tab === 'Reassessment Due' && audit.due.startsWith('Due')) || audit.status === tab)
  }).sort((a,b)=>sort==='Name A–Z'?a.name.localeCompare(b.name):sort==='Status'?a.status.localeCompare(b.status):sort==='Priority'?(b.score??-1)-(a.score??-1):0)
  const editing = rows.find(audit => audit.id === editingId)
  const updateAudit = (values: Record<string,string>) => { setRows(current => current.map(audit => audit.id === editingId ? { ...audit, name: values.name, scope: values.scope, owner: values.owner, status: values.status, next: values.next || '—', updated: 'Just now' } : audit)); setToast('Audit details updated and attributed to Alex Reed.') }
  const duplicateAudit = (id: string) => { const source = rows.find(audit => audit.id === id); if (!source) return; const copy = { ...source, id: `${source.id}-COPY`, name: `${source.name} (Copy)`, status: 'In Progress', score: null, archived: false, updated: 'Just now', owner: 'Alex Reed' }; setRows(current => [copy, ...current]); setToast('Audit configuration duplicated as a new draft.') }
  const confirmLifecycle = () => { if (!confirm) return; setRows(current => current.map(audit => audit.id === confirm.id ? { ...audit, archived: !confirm.restore } : audit)); setToast(confirm.restore ? 'Audit restored successfully.' : 'Audit archived. Its history remains available.'); setConfirm(null) }

  return (
    <div>
      <PageHeader title="Audits" description="View and manage all audits across your organisations." action={<Link href="/audits/new"><PrimaryButton><Plus className="size-4" /> New Audit</PrimaryButton></Link>} />
      <PageTabs tabs={TABS} active={tab} onChange={value=>{setTab(value);setSelected([])}} className="-mt-2 mb-4" />
      <TableToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search audits…" sortValue={sort} onSortChange={setSort} filters={[{label:'Organisation',value:organisation,onChange:setOrganisation,allValue:'All Organisations',options:['All Organisations','Oak & Pixel','HIMARK']},{label:'Audit type',value:auditType,onChange:setAuditType,allValue:'All Audit Types',options:['All Audit Types',...AUDIT_TYPE_NAMES,'Custom Audit']},{label:'Status',value:status,onChange:setStatus,allValue:'All Statuses',options:['All Statuses','Completed','In Progress']}]} selectedCount={selected.length} onClearSelection={()=>setSelected([])} bulkActions={[{label:'Assign owner',onClick:()=>selected[0]&&setEditingId(selected[0])},{label:'Export',onClick:()=>setToast(`${selected.length} audit records prepared for export.`)},{label:'Archive',destructive:true,onClick:()=>{setRows(current=>current.map(record=>selected.includes(record.id)?{...record,archived:true}:record));setToast(`${selected.length} audits archived with history retained.`);setSelected([])}}]}/>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_264px]">
        <Panel className="min-w-0 overflow-hidden">
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1020px] table-fixed text-left text-[11px]">
            <thead><tr className="h-12 border-b border-border bg-muted/10 text-foreground"><th className="w-10 px-3"><input type="checkbox" aria-label="Select all visible audits" checked={filtered.length>0&&filtered.every(item=>selected.includes(item.id))} onChange={event=>setSelected(event.target.checked?filtered.map(item=>item.id):[])} className="size-3.5 accent-[oklch(0.16_0_0)]"/></th><th className="w-[24%] px-3 font-semibold">Audit Name</th><th className="w-[14%] px-3 font-semibold">Audit Type</th><th className="w-[13%] px-3 font-semibold">Organisation / Scope</th><th className="w-[9%] px-3 font-semibold">Status</th><th className="w-[8%] px-3 font-semibold">Score</th><th className="w-[14%] px-3 font-semibold">Last Updated</th><th className="w-[12%] px-3 font-semibold">Next Reassessment</th><th className="w-8" /></tr></thead>
            <tbody>{filtered.map((audit) => <AuditRow key={audit.id} audit={audit} selected={selected.includes(audit.id)} onSelect={()=>setSelected(current=>current.includes(audit.id)?current.filter(id=>id!==audit.id):[...current,audit.id])} onView={() => router.push(`/audits/${audit.id}`)} onEdit={() => setEditingId(audit.id)} onDuplicate={() => duplicateAudit(audit.id)} onArchive={() => setConfirm({ id: audit.id, restore: audit.archived })} />)}</tbody>
          </table></div>
          <div className="divide-y divide-border md:hidden">{filtered.map(audit=><article key={audit.id} className="p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Select ${audit.name}`} checked={selected.includes(audit.id)} onChange={()=>setSelected(current=>current.includes(audit.id)?current.filter(id=>id!==audit.id):[...current,audit.id])} className="mt-1 size-4 accent-[oklch(0.16_0_0)]"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{audit.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{audit.type} · {audit.scope}</p></div><CrudActionMenu actions={[{label:'View Audit',kind:'view',onSelect:()=>router.push(`/audits/${audit.id}`)},{label:'Edit Details',kind:'edit',onSelect:()=>setEditingId(audit.id)},{label:audit.archived?'Restore':'Archive',kind:audit.archived?'restore':'archive',onSelect:()=>setConfirm({id:audit.id,restore:audit.archived})}]}/></div><div className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-muted/35 p-3 text-[10px]"><div><p className="text-muted-foreground">Status</p><p className="mt-1 font-semibold">{audit.archived?'Archived':audit.status}</p></div><div><p className="text-muted-foreground">Score</p><p className="mt-1 font-semibold">{audit.score??'—'}</p></div><div><p className="text-muted-foreground">Owner</p><p className="mt-1 truncate font-semibold">{audit.owner}</p></div></div><button onClick={()=>router.push(`/audits/${audit.id}`)} className="mt-3 h-9 w-full rounded-md border border-border text-xs font-semibold">View Audit</button></article>)}</div>
          {filtered.length === 0 && <CrudEmptyState title={tab === 'Archived' ? 'No archived audits' : 'No audits found'} description={tab === 'Archived' ? 'Archived audits will remain available here for governed restore.' : 'Create an audit or adjust the current filters.'} actionLabel={tab === 'Archived' ? 'View all audits' : 'New Audit'} onAction={() => tab === 'Archived' ? setTab('All Audits') : router.push('/audits/new')} />}
          <div className="flex items-center justify-between border-t border-border px-4 py-4 text-xs text-muted-foreground"><span>Showing 1 to {filtered.length} of {rows.length} audits</span><Pagination page={1} totalPages={1} onChange={() => undefined} /></div>
        </Panel>
        <aside className="space-y-3">
          <Card className="p-4"><h3 className="mb-4 text-xs font-semibold">Audit Overview</h3><div className="space-y-2.5 text-xs"><StatRow label="Total Audits" value="8" /><StatRow label="Active" value="3" /><StatRow label="Completed" value="5" /><StatRow label="Reassessment Due" tooltip="Completed audits whose configured reassessment date is approaching or overdue." value="2" /><StatRow label="Average Score" tooltip="Mean score across completed, numerically scored audits in the current register." value={<><span className="font-semibold">75</span><span className="text-muted-foreground"> /100</span></>} /></div></Card>
          <Card className="p-4"><h3 className="mb-4 text-xs font-semibold">Audit Types</h3><div className="mb-4 flex justify-center"><DonutChart data={typeChart} size={82} thickness={13} /></div><DonutLegend data={typeChart} /></Card>
          <Card className="p-4"><h3 className="mb-4 text-xs font-semibold">Reassessment Due Soon</h3><div className="space-y-3 text-[11px]"><DueItem name="Oak & Pixel Website — Feb 2026" due="Due in 10 days" /><DueItem name="IT Security Posture — Baseline" due="Due in 5 days" /><DueItem name="HR Policy Review — Baseline" due="Due in 1 day" /></div><Link href="/audits/calendar" className="mt-5 inline-flex text-[11px] font-semibold text-brand">View calendar &nbsp; →</Link></Card>
        </aside>
      </div>
      <CrudFormDialog open={Boolean(editing)} onClose={() => setEditingId(null)} onSubmit={updateAudit} title="Edit Audit Details" description="Update safe audit metadata. Completed assessment results are preserved." fields={editing ? [{name:'name',label:'Audit name',value:editing.name,required:true},{name:'scope',label:'Organisation / scope',value:editing.scope,required:true},{name:'owner',label:'Owner',value:editing.owner,type:'select',options:['Alex Reed','Thelma Mothiba','Maya Khan']},{name:'status',label:'Status',value:editing.status,type:'select',options:editing.status === 'Completed' ? ['Completed'] : ['In Progress','Completed']},{name:'next',label:'Next reassessment',value:editing.next === '—' ? '' : editing.next},{name:'notes',label:'Notes',value:'',type:'textarea'}] : []} />
      <ConfirmActionDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={confirmLifecycle} title={confirm?.restore ? 'Restore Audit?' : 'Archive Audit?'} description={confirm?.restore ? 'The audit will return to the active audit register.' : 'The audit will become read-only and move to Archived. Its evidence, lineage and activity will be retained.'} confirmLabel={confirm?.restore ? 'Restore Audit' : 'Archive Audit'} destructive={!confirm?.restore} />
      {toast && <CrudToast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

function AuditRow({ audit, selected, onSelect, onView, onEdit, onDuplicate, onArchive }: { audit: (typeof auditRows)[number] & { archived: boolean }; selected:boolean; onSelect:()=>void; onView: () => void; onEdit: () => void; onDuplicate: () => void; onArchive: () => void }) {
  const icons = { monitor: Monitor, shield: Shield, globe: Globe2, network: Network, badge: BadgeCheck, 'shield-check': ShieldCheck }
  const Icon = icons[audit.icon as keyof typeof icons]
  return <tr className={cn('h-[65px] border-b border-border last:border-0 hover:bg-muted/20',selected&&'bg-brand-muted/15')}><td className="px-3"><input type="checkbox" aria-label={`Select ${audit.name}`} checked={selected} onChange={onSelect} className="size-3.5 accent-[oklch(0.16_0_0)]"/></td><td className="px-3"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted"><Icon className="size-4" /></span><div className="min-w-0"><Link href={`/audits/${audit.id}`} className="block truncate font-semibold text-foreground">{audit.name}</Link><p className="mt-1 truncate text-muted-foreground">{audit.id}</p></div></div></td><td className="px-3">{audit.type}</td><td className="px-3 leading-5">{audit.scope}</td><td className="px-3"><span className={cn('whitespace-nowrap rounded border px-2 py-1 font-medium', audit.archived ? 'border-border bg-muted text-muted-foreground' : audit.status === 'Completed' ? 'border-success/15 bg-success-muted text-success' : 'border-info/15 bg-info-muted text-info')}>{audit.archived ? 'Archived' : audit.status}</span></td><td className="px-3">{audit.score === null ? '—' : <span><b className="text-base text-brand">{audit.score}</b><span className="text-muted-foreground"> /100</span></span>}</td><td className="px-3 leading-5"><p>{audit.updated}</p><p className="text-muted-foreground">{audit.owner}</p></td><td className="px-3 leading-5"><p>{audit.next}</p>{audit.due && <p className={cn(audit.due.startsWith('Due') && 'text-brand')}>{audit.due}</p>}</td><td className="px-1"><CrudActionMenu actions={audit.archived ? [{label:'View read-only',kind:'view',onSelect:onView},{label:'Restore',kind:'restore',onSelect:onArchive}] : [{label:'View Audit',kind:'view',onSelect:onView},{label:'Edit Details',kind:'edit',onSelect:onEdit},{label:'Duplicate Configuration',kind:'duplicate',onSelect:onDuplicate},{label:'Archive',kind:'archive',onSelect:onArchive}]} /></td></tr>
}

function DueItem({ name, due }: { name: string; due: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="truncate">{name}</span><span className="whitespace-nowrap font-semibold text-brand">{due}</span></div>
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { frameworks } from '@/data/mock/frameworks'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'
import { PageHeader } from '@/components/layout/page-header'
import { PageTabs } from '@/components/ui/tabs'
import { Panel } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { FrameworkTable } from './framework-table'
import { FrameworkSummaryCards } from './framework-card'
import { ReferenceVariant } from '@/components/ui/reference-variant'
import { ConfirmActionDialog, CrudEmptyState, CrudFormDialog, CrudToast } from '@/components/ui/crud'
import type { Status } from '@/data/mock/trace'
import { TableToolbar } from '@/components/ui/table-toolbar'

const tabs = ['All Frameworks', 'My Frameworks', 'Shared With Me', 'Archived', 'Deprecated']

export function FrameworksView() {
  const router=useRouter()
  const [records,setRecords]=useState(()=>frameworks.map(framework=>({...framework})))
  const [tab, setTab] = useState(tabs[0])
  const [query, setQuery] = useState('')
  const [auditType, setAuditType] = useState('All Audit Types')
  const [status, setStatus] = useState('All Statuses')
  const [editingId,setEditingId]=useState<string|null>(null);const [confirm,setConfirm]=useState<{id:string;mode:'archive'|'restore'|'deprecate'}|null>(null);const [toast,setToast]=useState('');const [sort,setSort]=useState('Recently updated')
  const filtered = records.filter((framework) => (!query || `${framework.name} ${framework.description}`.toLowerCase().includes(query.toLowerCase())) && (auditType === 'All Audit Types' || framework.auditType === auditType) && (status === 'All Statuses' || framework.status === status) && (tab==='Archived'?framework.status==='Archived':tab==='Deprecated'?framework.status==='Deprecated':framework.status!=='Archived'&&framework.status!=='Deprecated'))
  const editing=records.find(record=>record.id===editingId)
  const duplicate=(id:string)=>{const source=records.find(record=>record.id===id);if(!source)return;setRecords(current=>[{...source,id:`${source.id}-copy-${Date.now()}`,code:`${source.code}-COPY`,name:`${source.name} (Copy)`,version:'v0.1',status:'Draft' as Status,usage:0,lastUpdated:'Just now'},...current]);setToast('Framework duplicated as a new draft without historical usage.')}
  const lifecycle=()=>{if(!confirm)return;const next:Status=confirm.mode==='archive'?'Archived':confirm.mode==='deprecate'?'Deprecated':'Draft';setRecords(current=>current.map(record=>record.id===confirm.id?{...record,status:next,lastUpdated:'Just now'}:record));setToast(confirm.mode==='archive'?'Framework archived. Existing audits remain linked to their version.':confirm.mode==='deprecate'?'Framework deprecated for new audits.':'Framework restored as a draft.');setConfirm(null)}

  return (
    <div>
      <PageHeader title="Frameworks" description="Manage the frameworks that power TRACE audits. Use, customise and version frameworks for consistency and scale." action={<Link href="/frameworks/new" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Plus className="size-4" /> New Framework</Link>} />
      <PageTabs tabs={tabs} active={tab} onChange={setTab} className="-mt-2 mb-4" />
      <TableToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search frameworks…" sortValue={sort} onSortChange={setSort} filters={[{label:'Audit type',value:auditType,onChange:setAuditType,allValue:'All Audit Types',options:['All Audit Types',...AUDIT_TYPE_NAMES]},{label:'Status',value:status,onChange:setStatus,allValue:'All Statuses',options:['All Statuses','Active','Draft','Inactive']}]} />
      {['All Frameworks','Archived','Deprecated'].includes(tab) ? <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_264px]">
        <Panel className="min-w-0 overflow-hidden">{filtered.length?<FrameworkTable frameworks={filtered} onView={id=>router.push(`/frameworks/${id}`)} onEdit={setEditingId} onDuplicate={duplicate} onArchive={id=>setConfirm({id,mode:'archive'})} onRestore={id=>setConfirm({id,mode:'restore'})} onDeprecate={id=>setConfirm({id,mode:'deprecate'})}/>:<CrudEmptyState title={`No ${tab.toLowerCase()}`} description="Governed framework records that match this view will appear here." actionLabel={tab==='All Frameworks'?'New Framework':'View all frameworks'} onAction={()=>tab==='All Frameworks'?router.push('/frameworks/new'):setTab('All Frameworks')}/>}<div className="flex items-center justify-between px-4 py-4"><p className="text-sm text-muted-foreground">Showing 1 to {filtered.length} of {records.length} frameworks</p><Pagination page={1} totalPages={1} onChange={() => {}} /></div></Panel>
        <FrameworkSummaryCards />
      </div> : <ReferenceVariant domain="frameworks" tab={tab} />}
      <CrudFormDialog open={Boolean(editing)} onClose={()=>setEditingId(null)} onSubmit={values=>{if(!editing)return;const creatingVersion=editing.status==='Active';setRecords(current=>current.map(record=>record.id===editingId?{...record,name:values.name,description:values.description,status:(creatingVersion?'Draft':values.status) as Status,version:creatingVersion?`v${Number(record.version.slice(1))+0.1}`:record.version,lastUpdated:'Just now'}:record));setToast(creatingVersion?'New framework version created as a draft.':'Framework draft updated.')}} title={editing?.status==='Active'?'Create New Framework Version':'Edit Framework Draft'} description={editing?.status==='Active'?'Published and used versions are immutable. Structural edits create a governed draft version.':'Update draft framework metadata and governance.'} fields={editing?[{name:'name',label:'Framework name',value:editing.name,required:true},{name:'status',label:'Status',value:editing.status,type:'select',options:['Draft','Active','Inactive']},{name:'auditType',label:'Audit type',value:editing.auditType},{name:'description',label:'Description',value:editing.description,type:'textarea'}]:[]}/>
      <ConfirmActionDialog open={Boolean(confirm)} onClose={()=>setConfirm(null)} onConfirm={lifecycle} title={confirm?.mode==='restore'?'Restore Framework?':confirm?.mode==='deprecate'?'Deprecate Framework?':'Archive Framework?'} description={confirm?.mode==='restore'?'The framework will return as a draft and must be reviewed before publication.':confirm?.mode==='deprecate'?'It will remain available to linked audits but cannot be selected for new audits.':'The framework will become read-only. Historical audits and version links are preserved.'} confirmLabel={confirm?.mode==='restore'?'Restore Framework':confirm?.mode==='deprecate'?'Deprecate Framework':'Archive Framework'} destructive={confirm?.mode!=='restore'}/>
      {toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>} 
    </div>
  )
}

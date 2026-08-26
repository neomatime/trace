'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'
import { templates } from '@/data/mock/templates'
import { PageHeader } from '@/components/layout/page-header'
import { PageTabs } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/pagination'
import { Panel } from '@/components/ui/card'
import { TemplateOverviewCards } from './template-card'
import { TemplateTable, type TemplatePermission, type TemplateTableRecord } from './template-table'
import { ConfirmActionDialog, CrudEmptyState, CrudFormDialog, CrudToast } from '@/components/ui/crud'
import type { Status } from '@/data/mock/trace'
import { TableToolbar } from '@/components/ui/table-toolbar'

const TABS = ['All Templates', 'My Templates', 'Shared With Me', 'Custom Frameworks', 'Archived']

export function TemplatesView() {
  const router = useRouter()
  const [records,setRecords]=useState<TemplateTableRecord[]>(()=>templates.map((template,index)=>({
    ...template,
    owner: template.createdBy,
    sharedBy: template.createdBy === 'Alex Reed' ? undefined : template.createdBy,
    sharedOn: template.createdBy === 'Alex Reed' ? undefined : ['18 Aug 2026','16 Aug 2026','12 Aug 2026'][index%3],
    permission: template.createdBy === 'Alex Reed' ? undefined : ({'brand-consistency-v1':'View Only','operational-flow-v1':'Can Edit','supplier-management-v1':'Can Use'}[template.id] as TemplatePermission),
    customFramework: ['custom-blank','supplier-management-v1','hr-policy-v1'].includes(template.id),
    frameworkCode: ({'custom-blank':'FWK-CUS-001','supplier-management-v1':'FWK-SUP-001','hr-policy-v1':'FWK-HR-001'} as Record<string,string>)[template.id],
  })))
  const [tab, setTab] = useState(TABS[0])
  const [query, setQuery] = useState('')
  const [auditType, setAuditType] = useState('All Audit Types')
  const [status, setStatus] = useState('All Statuses')
  const [page, setPage] = useState(1)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [confirm,setConfirm]=useState<{id:string;restore:boolean}|null>(null)
  const [sharingId,setSharingId]=useState<string|null>(null)
  const [toast,setToast]=useState('')
  const [sort,setSort]=useState('Recently updated')

  const filtered = records.filter((template) => {
    const normalisedQuery = query.toLowerCase()
    const matchesQuery = !normalisedQuery || template.name.toLowerCase().includes(normalisedQuery) || template.description.toLowerCase().includes(normalisedQuery)
    const matchesType = auditType === 'All Audit Types' || template.auditType === auditType
    const matchesStatus = status === 'All Statuses' || template.status === status
    const matchesTab = tab === 'Archived' ? template.status === 'Archived' : tab === 'My Templates' ? template.status !== 'Archived' && template.owner === 'Alex Reed' : tab === 'Shared With Me' ? template.status !== 'Archived' && template.owner !== 'Alex Reed' : tab === 'Custom Frameworks' ? template.status !== 'Archived' && template.customFramework : template.status !== 'Archived'
    return matchesQuery && matchesType && matchesStatus && matchesTab
  })
  const editing=records.find(record=>record.id===editingId)
  const duplicate=(id:string)=>{const source=records.find(record=>record.id===id);if(!source)return;setRecords(current=>[{...source,id:`${source.id}-copy-${Date.now()}`,name:`${source.name} (Copy)`,owner:'Alex Reed',createdBy:'Alex Reed',sharedBy:undefined,sharedOn:undefined,permission:undefined,archivedBy:undefined,archivedOn:undefined,archiveReason:undefined,status:'Draft' as Status,usage:0,lastUpdated:'Just now'},...current]);setToast('Template duplicated as an independent draft owned by you.')}
  const lifecycle=()=>{if(!confirm)return;setRecords(current=>current.map(record=>record.id===confirm.id?{...record,status:(confirm.restore?'Draft':'Archived') as Status,lastUpdated:'Just now',archivedBy:confirm.restore?undefined:'Alex Reed',archivedOn:confirm.restore?undefined:'18 Aug 2026',archiveReason:confirm.restore?undefined:'Retired by owner'}:record));setToast(confirm.restore?'Template restored as a draft.':'Template archived. Existing audit links were preserved.');setConfirm(null)}

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Create, manage and reuse audit templates across different audit types and frameworks."
        action={<Link href="/templates/new" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Plus className="size-4" /> New Template</Link>}
      />

      <PageTabs tabs={TABS} active={tab} onChange={setTab} className="-mt-2 mb-4" />
      <TableToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search templates…" sortValue={sort} onSortChange={setSort} filters={[{label:'Audit type',value:auditType,onChange:setAuditType,allValue:'All Audit Types',options:['All Audit Types',...AUDIT_TYPE_NAMES]},{label:'Status',value:status,onChange:setStatus,allValue:'All Statuses',options:['All Statuses','Active','Inactive','Draft']}]} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_272px]">
        <Panel className="min-w-0 overflow-hidden">
          {filtered.length?<TemplateTable view={tab} templates={filtered} onView={id=>router.push(`/templates/${id}`)} onEdit={setEditingId} onDuplicate={duplicate} onArchive={id=>setConfirm({id,restore:false})} onRestore={id=>setConfirm({id,restore:true})} onShare={setSharingId}/>:<CrudEmptyState title={tab==='Archived'?'No archived templates':'No templates found'} description={tab==='Archived'?'Archived templates will remain available here for restore.':'Create a template or adjust the current filters.'} actionLabel={tab==='Archived'?'View all templates':'New Template'} onAction={()=>tab==='Archived'?setTab('All Templates'):router.push('/templates/new')}/>} 
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">Showing 1 to {filtered.length} of {records.length} templates</p>
            <Pagination page={page} totalPages={1} onChange={setPage} />
          </div>
        </Panel>
        <TemplateOverviewCards />
      </div>
      <CrudFormDialog open={Boolean(editing)} onClose={()=>setEditingId(null)} onSubmit={values=>{setRecords(current=>current.map(record=>record.id===editingId?{...record,name:values.name,description:values.description,framework:values.framework,status:values.status as Status,lastUpdated:'Just now'}:record));setToast(editing?.status==='Active'?'New template version created as a draft.':'Template draft updated.')}} title={editing?.status==='Active'?'Create New Template Version':'Edit Template Draft'} description={editing?.status==='Active'?'Used versions are immutable. Your changes will create a new draft version.':'Update template defaults and metadata.'} fields={editing?[{name:'name',label:'Template name',value:editing.name,required:true},{name:'status',label:'Status',value:editing.status==='Active'?'Draft':editing.status,type:'select',options:['Draft','Active','Inactive']},{name:'framework',label:'Framework',value:editing.framework,required:true},{name:'description',label:'Description',value:editing.description,type:'textarea'}]:[]}/>
      <CrudFormDialog open={Boolean(sharingId)} onClose={()=>setSharingId(null)} onSubmit={values=>{setToast(`Template shared with ${values.recipient} (${values.permission}).`);setSharingId(null)}} title="Share Template" description="Grant a named collaborator the minimum permission they need. Ownership and version history remain unchanged." submitLabel="Share Template" fields={sharingId?[{name:'recipient',label:'Recipient email',value:'',required:true},{name:'permission',label:'Permission',value:'Can Use',type:'select',options:['View Only','Can Use','Can Edit']}]:[]}/>
      <ConfirmActionDialog open={Boolean(confirm)} onClose={()=>setConfirm(null)} onConfirm={lifecycle} title={confirm?.restore?'Restore Template?':'Archive Template?'} description={confirm?.restore?'The template will return as a draft for review before activation.':'The template will not be available for new audits. Historical audit version links remain unchanged.'} confirmLabel={confirm?.restore?'Restore Template':'Archive Template'} destructive={!confirm?.restore}/>
      {toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>} 
    </div>
  )
}

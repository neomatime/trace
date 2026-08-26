'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { evidenceItems } from '@/data/mock/evidence'
import { PageHeader, PrimaryButton } from '@/components/layout/page-header'
import { SystemStatusBar } from '@/components/layout/system-status-bar'
import { PageTabs } from '@/components/ui/tabs'
import { Panel } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { EvidenceTable } from './evidence-table'
import { EvidenceSummary } from './evidence-summary'
import { ReferenceVariant } from '@/components/ui/reference-variant'
import { AddEvidenceDialog, type CreatedEvidenceItem } from './add-evidence-dialog'
import { ConfirmActionDialog, CrudEmptyState, CrudFormDialog, CrudToast } from '@/components/ui/crud'
import { TableToolbar } from '@/components/ui/table-toolbar'

const tabs=['All Evidence','By Audit','By Type','Needs Review','Validated','Archived']

export function EvidenceView(){
  const router=useRouter()
  const [items,setItems]=useState<CreatedEvidenceItem[]>([...evidenceItems])
  const [tab,setTab]=useState(tabs[0])
  const [query,setQuery]=useState('')
  const [type,setType]=useState('All Evidence Types')
  const [organisation,setOrganisation]=useState('All Organisations')
  const [sort,setSort]=useState('Recently updated')
  const [selected,setSelected]=useState<string[]>([])
  const [addOpen,setAddOpen]=useState(false)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [confirm,setConfirm]=useState<{id:string;restore:boolean}|null>(null)
  const [toast,setToast]=useState('')
  const filtered=items.filter(item=>(!query||`${item.name} ${item.audit} ${item.source}`.toLowerCase().includes(query.toLowerCase()))&&(type==='All Evidence Types'||item.type===type)&&(organisation==='All Organisations'||item.audit.includes(organisation)||(organisation==='HIMARK'&&item.audit.includes('HIMARK')))&&(tab==='Archived'?item.status==='Archived':tab==='Needs Review'?item.status==='Needs Review':tab==='Validated'?item.status==='Validated':item.status!=='Archived'))
  const editing=items.find(item=>item.id===editingId)
  const added=(item:CreatedEvidenceItem)=>{setItems(current=>[item,...current]);setTab('All Evidence');setToast('Evidence added and linked successfully.')}
  const lifecycle=()=>{if(!confirm)return;setItems(current=>current.map(item=>item.id===confirm.id?{...item,status:confirm.restore?'Needs Review':'Archived'}:item));setToast(confirm.restore?'Evidence restored to Needs Review.':'Evidence archived. Its original links and attribution were retained.');setConfirm(null)}
  const isGrouped=['By Audit','By Type'].includes(tab)
  return <div><PageHeader title="Evidence" description="Centralise, organise and manage the records that support findings, decisions and audit outcomes." action={<PrimaryButton onClick={()=>setAddOpen(true)}><Plus className="size-4"/> Add Evidence</PrimaryButton>}/><PageTabs tabs={tabs} active={tab} onChange={value=>{setTab(value);setSelected([])}} className="-mt-2 mb-4"/><TableToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search evidence…" sortValue={sort} onSortChange={setSort} filters={[{label:'Organisation',value:organisation,onChange:setOrganisation,allValue:'All Organisations',options:['All Organisations','Oak & Pixel','HIMARK']},{label:'Evidence type',value:type,onChange:setType,allValue:'All Evidence Types',options:['All Evidence Types','Screenshot','File','Report','Video','URL','Data','Document','Image']}]} selectedCount={selected.length} onClearSelection={()=>setSelected([])} bulkActions={[{label:'Assign reviewer',onClick:()=>selected[0]&&setEditingId(selected[0])},{label:'Export',onClick:()=>setToast(`${selected.length} evidence records prepared for export.`)},{label:'Archive',destructive:true,onClick:()=>{setItems(current=>current.map(item=>selected.includes(item.id)?{...item,status:'Archived'}:item));setToast(`${selected.length} evidence records archived with links retained.`);setSelected([])}}]}/>
    {isGrouped?<ReferenceVariant domain="evidence" tab={tab}/>:<div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_264px]"><Panel className="min-w-0 overflow-hidden">{filtered.length?<EvidenceTable evidence={filtered} selected={selected} onSelect={id=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id])} onSelectAll={checked=>setSelected(checked?filtered.map(item=>item.id):[])} onView={id=>router.push(`/evidence/${id}`)} onEdit={setEditingId} onArchive={id=>setConfirm({id,restore:false})} onRestore={id=>setConfirm({id,restore:true})}/>:<CrudEmptyState title={tab==='Archived'?'No archived evidence':'No evidence found'} description={tab==='Archived'?'Archived evidence remains governed and restorable here.':'Evidence supports findings and assessment results. Add evidence or adjust the filters.'} actionLabel={tab==='Archived'?'View all evidence':'Add Evidence'} onAction={()=>tab==='Archived'?setTab('All Evidence'):setAddOpen(true)}/>}<div className="flex items-center justify-between border-t border-border px-4 py-4"><p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of {items.length} evidence items</p><Pagination page={1} totalPages={1} onChange={()=>{}}/></div></Panel><EvidenceSummary/></div>}
    <SystemStatusBar/><AddEvidenceDialog open={addOpen} onClose={()=>setAddOpen(false)} onSuccess={added}/><CrudFormDialog open={Boolean(editing)} onClose={()=>setEditingId(null)} onSubmit={values=>{setItems(current=>current.map(item=>item.id===editingId?{...item,name:values.name,meta:values.description,source:values.source,type:values.type,status:values.status}:item));setToast('Evidence metadata and lifecycle updated.')}} title="Edit Evidence" description="Update metadata and review state. The original uploader and audit attribution remain immutable." fields={editing?[{name:'name',label:'Evidence name',value:editing.name,required:true},{name:'type',label:'Evidence type',value:editing.type,type:'select',options:['Screenshot','File','Report','Video','URL','Data','Document','Image']},{name:'source',label:'Source / location',value:editing.source,required:true},{name:'status',label:'Review status',value:editing.status,type:'select',options:['Needs Review','Under Review','Validated','Rejected']},{name:'description',label:'Description and tags',value:editing.meta,type:'textarea'}]:[]}/><ConfirmActionDialog open={Boolean(confirm)} onClose={()=>setConfirm(null)} onConfirm={lifecycle} title={confirm?.restore?'Restore Evidence?':'Archive Evidence?'} description={confirm?.restore?'The evidence will return to Needs Review with its original links intact.':'The evidence becomes read-only but remains linked to its audit, findings and activity.'} confirmLabel={confirm?.restore?'Restore Evidence':'Archive Evidence'} destructive={!confirm?.restore}/>{toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>}</div>
}

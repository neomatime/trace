import type { TemplateMock } from '@/data/mock/templates'
import type { CrudAction } from '@/components/ui/crud'
import { ActionMenu } from './template-actions'
import { StatusBadge } from '@/components/ui/badge'
import { RowIcon } from '@/components/ui/row-icon'
import { DataTable, Td, Th, THead, TRow } from '@/components/ui/table'
import Link from 'next/link'

export type TemplatePermission = 'View Only' | 'Can Use' | 'Can Edit'

export type TemplateTableRecord = TemplateMock & {
  owner: string
  sharedBy?: string
  sharedOn?: string
  permission?: TemplatePermission
  customFramework?: boolean
  frameworkCode?: string
  archivedBy?: string
  archivedOn?: string
  archiveReason?: string
}

type Props = {
  templates: readonly TemplateTableRecord[]
  view: string
  onView:(id:string)=>void
  onEdit:(id:string)=>void
  onDuplicate:(id:string)=>void
  onArchive:(id:string)=>void
  onRestore:(id:string)=>void
  onShare:(id:string)=>void
}

export function TemplateTable({ templates, view, onView, onEdit, onDuplicate, onArchive, onRestore, onShare }: Props) {
  const sharedView = view === 'Shared With Me'
  const customView = view === 'Custom Frameworks'
  const archivedView = view === 'Archived'
  return <>
    <div className="hidden md:block"><DataTable className="min-w-[1040px] table-fixed text-[11px]">
      <THead>
        <Th className="w-[25%] px-3">Template Name</Th><Th className="w-[13%] px-3">Audit Type</Th><Th className="w-[17%] px-3">Framework</Th>
        {sharedView ? <><Th className="w-[10%] px-3">Shared By</Th><Th className="w-[11%] px-3">Shared On</Th><Th className="w-[9%] px-3">Permission</Th></> : archivedView ? <><Th className="w-[10%] px-3">Archived By</Th><Th className="w-[11%] px-3">Archived On</Th><Th className="w-[9%] px-3">Reason</Th></> : <><Th className="w-[10%] px-3">Owner</Th><Th className="w-[13%] px-3">Last Updated</Th><Th className="w-[7%] px-3">{customView ? 'Framework ID' : 'Usage'}</Th></>}
        <Th className="w-[7%] px-3">Status</Th><Th className="w-10 px-1" align="center">Actions</Th>
      </THead>
      <tbody>{templates.map(template => <TRow key={template.id} className="h-[70px]">
        <Td className="px-3 py-2"><TemplateIdentity template={template}/></Td><Td className="px-3 py-2 text-muted-foreground">{template.auditType}</Td><Td className="px-3 py-2"><p className="truncate text-muted-foreground">{template.framework}</p>{customView&&<p className="mt-0.5 truncate text-[9px] font-semibold text-brand">Custom framework</p>}</Td>
        {sharedView ? <><Td className="px-3 py-2 text-muted-foreground">{template.sharedBy}</Td><Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{template.sharedOn}</Td><Td className="px-3 py-2"><PermissionBadge permission={template.permission}/></Td></> : archivedView ? <><Td className="px-3 py-2 text-muted-foreground">{template.archivedBy}</Td><Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{template.archivedOn}</Td><Td className="px-3 py-2 text-muted-foreground">{template.archiveReason}</Td></> : <><Td className="px-3 py-2 text-muted-foreground">{template.owner}</Td><Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{template.lastUpdated}</Td><Td className="px-3 py-2 text-muted-foreground">{customView ? template.frameworkCode : template.usage}</Td></>}
        <Td className="px-3 py-2"><StatusBadge status={template.status}/></Td><Td align="center" className="px-1 py-2"><ActionMenu actions={actionsFor(template, {onView,onEdit,onDuplicate,onArchive,onRestore,onShare})}/></Td>
      </TRow>)}</tbody>
    </DataTable></div>
    <div className="divide-y divide-border md:hidden">{templates.map(template=><article key={template.id} className="p-4"><div className="flex items-start gap-3"><RowIcon name={template.icon}/><div className="min-w-0 flex-1"><Link href={`/templates/${template.id}`} className="text-sm font-semibold">{template.name}</Link><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{template.description}</p></div><ActionMenu actions={actionsFor(template,{onView,onEdit,onDuplicate,onArchive,onRestore,onShare})}/></div><div className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-muted/35 p-3 text-[10px]"><Metric label="Audit type" value={template.auditType}/><Metric label={sharedView?'Permission':archivedView?'Archived by':'Owner'} value={sharedView?<PermissionBadge permission={template.permission}/>:archivedView?template.archivedBy:template.owner}/><Metric label="Status" value={<StatusBadge status={template.status}/>}/></div><button onClick={()=>onView(template.id)} className="mt-3 h-9 w-full rounded-md border border-border text-xs font-semibold">View Template</button></article>)}</div>
  </>
}

function TemplateIdentity({template}:{template:TemplateTableRecord}) { return <Link href={`/templates/${template.id}`} className="flex items-center gap-3 rounded-md outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"><RowIcon name={template.icon}/><div className="min-w-0"><p className="truncate font-medium text-foreground">{template.name}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{template.description}</p></div></Link> }
function PermissionBadge({permission}:{permission?:TemplatePermission}) { return <span className="inline-flex rounded-full bg-info-muted px-2 py-1 text-[9px] font-semibold text-info">{permission ?? 'View Only'}</span> }
function Metric({label,value}:{label:string;value:React.ReactNode}) { return <div><p className="text-muted-foreground">{label}</p><div className="mt-1 font-semibold">{value}</div></div> }

function actionsFor(template:TemplateTableRecord, handlers:Omit<Props,'templates'|'view'>): CrudAction[] {
  const view:CrudAction={label:template.status==='Archived'?'View read-only':'View Template',kind:'view',onSelect:()=>handlers.onView(template.id)}
  if(template.status==='Archived') return [view,{label:'Restore Template',kind:'restore',onSelect:()=>handlers.onRestore(template.id)},{label:'Duplicate as Draft',kind:'duplicate',onSelect:()=>handlers.onDuplicate(template.id)}]
  if(template.owner !== 'Alex Reed') {
    if(template.permission==='View Only') return [view]
    if(template.permission==='Can Use') return [view,{label:'Use as New Draft',kind:'duplicate',onSelect:()=>handlers.onDuplicate(template.id)}]
    return [view,{label:'Edit Shared Template',kind:'edit',onSelect:()=>handlers.onEdit(template.id)},{label:'Duplicate as Draft',kind:'duplicate',onSelect:()=>handlers.onDuplicate(template.id)}]
  }
  return [view,{label:template.status==='Active'?'Create New Version':'Edit Draft',kind:'edit',onSelect:()=>handlers.onEdit(template.id)},{label:'Duplicate as Draft',kind:'duplicate',onSelect:()=>handlers.onDuplicate(template.id)},{label:'Share Template',kind:'view',onSelect:()=>handlers.onShare(template.id)},{label:'Archive Template',kind:'archive',onSelect:()=>handlers.onArchive(template.id)}]
}

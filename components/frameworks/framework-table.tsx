import type { frameworks } from '@/data/mock/frameworks'
import { DataTable, Td, Th, THead, TRow } from '@/components/ui/table'
import { RowIcon } from '@/components/ui/row-icon'
import { StatusBadge } from '@/components/ui/badge'
import { ActionMenu } from '@/components/templates/template-actions'
import Link from 'next/link'

type FrameworkMock = (typeof frameworks)[number]

export function FrameworkTable({ frameworks, onView, onEdit, onDuplicate, onArchive, onRestore, onDeprecate }: { frameworks: readonly FrameworkMock[]; onView:(id:string)=>void; onEdit:(id:string)=>void; onDuplicate:(id:string)=>void; onArchive:(id:string)=>void; onRestore:(id:string)=>void; onDeprecate:(id:string)=>void }) {
  return (
    <><div className="hidden md:block"><DataTable className="min-w-[1000px] table-fixed text-[11px]">
      <THead><Th className="w-[23%] px-3">Framework Name</Th><Th className="w-[12%] px-3">Audit Type</Th><Th className="w-[17%] px-3">Description</Th><Th className="w-[6%] px-3">Version</Th><Th className="w-[9%] px-3">Created By</Th><Th className="w-[15%] px-3">Last Updated</Th><Th className="w-[7%] px-3">Status</Th><Th className="w-[5%] px-3">Usage</Th><Th className="w-10 px-1">Actions</Th></THead>
      <tbody>
        {frameworks.map((framework) => (
          <TRow key={framework.id} className="h-[66px]">
            <Td className="px-3 py-2"><Link href={`/frameworks/${framework.id}`} className="flex items-center gap-3 rounded-md outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"><RowIcon name={framework.icon} /><div className="min-w-0"><p className="truncate font-semibold">{framework.name}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{framework.code}</p></div></Link></Td>
            <Td className="px-3 py-2 text-muted-foreground">{framework.auditType}</Td>
            <Td className="px-3 py-2 leading-5 text-muted-foreground">{framework.description}</Td>
            <Td className="px-3 py-2"><span className="rounded border border-border bg-muted px-2 py-1 text-[11px]">{framework.version}</span></Td>
            <Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{framework.createdBy}</Td>
            <Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{framework.lastUpdated}</Td>
            <Td className="px-3 py-2"><StatusBadge status={framework.status} /></Td>
            <Td className="px-3 py-2">{framework.usage}</Td><Td className="px-1 py-2"><ActionMenu actions={framework.status==='Archived'?[{label:'View read-only',kind:'view',onSelect:()=>onView(framework.id)},{label:'Restore Framework',kind:'restore',onSelect:()=>onRestore(framework.id)}]:[{label:'View Framework',kind:'view',onSelect:()=>onView(framework.id)},{label:framework.status==='Active'?'Create New Version':'Edit Draft',kind:'edit',onSelect:()=>onEdit(framework.id)},{label:'Duplicate as Draft',kind:'duplicate',onSelect:()=>onDuplicate(framework.id)},{label:'Deprecate',onSelect:()=>onDeprecate(framework.id)},{label:'Archive Framework',kind:'archive',onSelect:()=>onArchive(framework.id)}]} /></Td>
          </TRow>
        ))}
      </tbody>
    </DataTable></div><div className="divide-y divide-border md:hidden">{frameworks.map(framework=><article key={framework.id} className="p-4"><div className="flex items-start gap-3"><RowIcon name={framework.icon}/><div className="min-w-0 flex-1"><Link href={`/frameworks/${framework.id}`} className="text-sm font-semibold">{framework.name}</Link><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{framework.description}</p></div><ActionMenu actions={framework.status==='Archived'?[{label:'View read-only',kind:'view',onSelect:()=>onView(framework.id)},{label:'Restore Framework',kind:'restore',onSelect:()=>onRestore(framework.id)}]:[{label:'View Framework',kind:'view',onSelect:()=>onView(framework.id)},{label:framework.status==='Active'?'Create New Version':'Edit Draft',kind:'edit',onSelect:()=>onEdit(framework.id)},{label:'Duplicate as Draft',kind:'duplicate',onSelect:()=>onDuplicate(framework.id)},{label:'Deprecate',onSelect:()=>onDeprecate(framework.id)},{label:'Archive Framework',kind:'archive',onSelect:()=>onArchive(framework.id)}]}/></div><div className="mt-4 grid grid-cols-3 gap-3 rounded-md bg-muted/35 p-3 text-[10px]"><div><p className="text-muted-foreground">Version</p><p className="mt-1 font-semibold">{framework.version}</p></div><div><p className="text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={framework.status}/></div></div><div><p className="text-muted-foreground">Usage</p><p className="mt-1 font-semibold">{framework.usage}</p></div></div><button onClick={()=>onView(framework.id)} className="mt-3 h-9 w-full rounded-md border border-border text-xs font-semibold">View Framework</button></article>)}</div></>
  )
}

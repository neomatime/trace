'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { auditWorkspaceMeta } from '@/data/mock/audit-workflows'
import { frameworks } from '@/data/mock/frameworks'
import { templates } from '@/data/mock/templates'

type Crumb={label:string;href:string}
const labels:Record<string,string>={track:'Track Audit',collection:'Collection',workflow:'Workflow',findings:'Findings',recommendations:'Recommendations',evidence:'Evidence','technical-details':'Technical Details',reassessment:'Reassessment',activity:'Activity',new:'Create New',organisation:'Organisation',users:'Team & Users','audit-defaults':'Audit Defaults',integrations:'Integrations',notifications:'Notifications',security:'Security',system:'System',profile:'My Profile'}

function buildCrumbs(pathname:string){
  const parts=pathname.split('/').filter(Boolean)
  if(parts.length<2)return []
  const crumbs:Crumb[]=[]
  let href=''
  parts.forEach((part,index)=>{
    href+=`/${part}`
    let label=labels[part]||part.replace(/-/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())
    if(index===0) label=part==='audits'?'Audits':part==='frameworks'?'Frameworks':part==='templates'?'Templates':part==='evidence'?'Evidence':part==='settings'?'Settings':part==='history'?'History':label
    if(parts[0]==='audits'&&index===1&&part!=='new') label=auditWorkspaceMeta[part]?.name||'Audit Workspace'
    if(parts[0]==='frameworks'&&index===1&&part!=='new') label=frameworks.find(item=>item.id===part)?.name||'Framework Details'
    if(parts[0]==='templates'&&index===1&&part!=='new') label=templates.find(item=>item.id===part)?.name||'Template Details'
    if(parts[0]==='evidence'&&index===1) label='Page Load Test Report'
    if(part==='new') label=parts[0]==='audits'?'Create New Audit':parts[0]==='frameworks'?'Create New Framework':'Create New Template'
    crumbs.push({label,href})
  })
  return crumbs
}

export function RouteBreadcrumbs(){
  const pathname=usePathname();const crumbs=buildCrumbs(pathname)
  if(!crumbs.length)return null
  const parent=crumbs[Math.max(0,crumbs.length-2)]
  return <div className="mb-4 min-w-0"><Link href={parent.href} className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground sm:hidden"><ChevronLeft className="size-3.5 shrink-0"/><span className="truncate">{parent.label}</span></Link><nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-muted-foreground sm:flex"><Link href="/audits" aria-label="Dashboard" className="shrink-0 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Home className="size-3.5"/></Link>{crumbs.map((crumb,index)=><span key={crumb.href} className="flex min-w-0 items-center gap-1.5"><ChevronRight className="size-3 shrink-0 text-border"/>{index===crumbs.length-1?<span aria-current="page" className="truncate font-medium text-foreground">{crumb.label}</span>:<Link href={crumb.href} className="max-w-56 truncate hover:text-foreground">{crumb.label}</Link>}</span>)}</nav></div>
}

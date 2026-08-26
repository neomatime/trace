'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAuditTypeFromAuditId } from '@/config/audit-types'
import { ChevronLeft, ChevronRight, Layers3 } from 'lucide-react'
import { useEffect, useRef } from 'react'

const slugs:Record<string,string>={'Overview':'','Track Audit':'track','Collection':'collection','Workflow':'workflow','Findings':'findings','Recommendations':'recommendations','Actions':'actions','Evidence':'evidence','Workpapers':'workpapers','Review':'review','Reports':'reports','Planning':'planning','Technical Details':'technical-details','Reassessment':'reassessment','Activity':'activity'}

export function AuditTabs(){
  const pathname=usePathname()
  const auditId=pathname.split('/')[2]||'TRC-WEB-2026-0042'
  const type=getAuditTypeFromAuditId(auditId)
  const tabsRef=useRef<HTMLElement>(null)
  const visibleTabs=type.supportedTabs.flatMap(label=>label==='Overview'?[label,'Track Audit']:[label])

  useEffect(()=>{
    const active=tabsRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
  },[pathname])

  const scrollTabs=(direction:-1|1)=>tabsRef.current?.scrollBy({left:direction*220,behavior:'smooth'})

  return <>
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[11px]">
      <span className="flex items-center gap-1.5 font-semibold"><Layers3 className="size-3.5 text-brand"/> Baseline Assessment</span>
      <span className="text-muted-foreground">{type.name}</span>
      <span className="text-muted-foreground">HIMARK {type.name} Framework v1.3</span>
      <span className="ml-auto whitespace-nowrap font-semibold">24 / 42 checks <span className="font-normal text-muted-foreground">· 57%</span></span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:w-28" role="progressbar" aria-label="Assessment progress" aria-valuemin={0} aria-valuemax={42} aria-valuenow={24} aria-valuetext="24 of 42 checks completed, 57 percent"><div className="h-full w-[57%] rounded-full bg-brand"/></div>
    </div>
    <div className="relative mb-5">
      <button type="button" onClick={()=>scrollTabs(-1)} aria-label="Show previous audit tabs" className="absolute bottom-px left-0 z-10 flex h-[37px] w-8 items-center justify-start bg-gradient-to-r from-background via-background to-transparent text-muted-foreground md:hidden"><ChevronLeft className="size-4"/></button>
      <nav ref={tabsRef} aria-label="Audit workspace" className="flex max-w-full gap-6 overflow-x-auto border-b border-border px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-8 md:px-0">
        {visibleTabs.map(label=>{const href=`/audits/${auditId}${slugs[label]?`/${slugs[label]}`:''}`;const active=pathname===href;return <Link key={label} href={href} aria-current={active?'page':undefined} className={`whitespace-nowrap border-b-2 px-1 pb-3 text-xs transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:text-sm ${active?'border-brand font-semibold text-brand':'border-transparent text-foreground hover:text-brand'}`}>{label}</Link>})}
      </nav>
      <button type="button" onClick={()=>scrollTabs(1)} aria-label="Show more audit tabs" className="absolute bottom-px right-0 z-10 flex h-[37px] w-8 items-center justify-end bg-gradient-to-l from-background via-background to-transparent text-muted-foreground md:hidden"><ChevronRight className="size-4"/></button>
    </div>
  </>
}

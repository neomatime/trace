'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, ChevronRight, Clock, Download, HelpCircle, LogOut, Menu, Plus, UserRound, X } from 'lucide-react'
import { TraceLogo } from './trace-logo'
import { DASHBOARD_NAVIGATION } from '@/config/navigation'
import { currentUser } from '@/data/mock/users'
import { ConfirmActionDialog } from '@/components/ui/crud'
import { Tooltip } from '@/components/ui/tooltip'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const inAudit = pathname.startsWith('/audits')
  const [drawerOpen,setDrawerOpen]=useState(false)
  const [signOutOpen,setSignOutOpen]=useState(false)
  const reduceMotion=useReducedMotion()

  useEffect(()=>{
    if(!drawerOpen)return
    const previous=document.body.style.overflow
    document.body.style.overflow='hidden'
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setDrawerOpen(false)}
    document.addEventListener('keydown',close)
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close)}
  },[drawerOpen])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b border-border bg-background px-6 lg:px-12">
      <Tooltip content="Open navigation"><button type="button" onClick={()=>setDrawerOpen(true)} aria-label="Open navigation menu" className="-ml-2 flex size-9 items-center justify-center rounded-md hover:bg-muted lg:hidden"><Menu className="size-5"/></button></Tooltip>

      <nav className="flex items-center gap-6">
        <Link
          href="/audits/new"
          className="flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          New Audit
        </Link>
        <Link
          href={inAudit ? '/history' : '/audits'}
          className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/70 sm:flex"
        >
          <Clock className="size-4" strokeWidth={1.75} />
          {inAudit ? 'History' : 'Audits'}
        </Link>
        <Link
          href="/evidence"
          className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/70 sm:flex"
        >
          <Download className="size-4" strokeWidth={1.75} />
          Export
        </Link>
      </nav>

      <div className="ml-auto">
        <Tooltip content="Open TRACE help"><button className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/70">
          <HelpCircle className="size-4" strokeWidth={1.75} />
          Help
        </button></Tooltip>
      </div>
      <AnimatePresence>{drawerOpen&&<motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduceMotion?0.08:0.28,ease:[0.22,1,0.36,1]}}><motion.button aria-label="Close navigation menu" onClick={()=>setDrawerOpen(false)} className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/><motion.aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col border-r border-border bg-background shadow-2xl" initial={reduceMotion?{opacity:0}:{x:'-100%',boxShadow:'0 0 0 rgba(0,0,0,0)'}} animate={reduceMotion?{opacity:1}:{x:0,boxShadow:'22px 0 60px rgba(0,0,0,.22)'}} exit={reduceMotion?{opacity:0}:{x:'-100%',boxShadow:'0 0 0 rgba(0,0,0,0)'}} transition={{duration:reduceMotion?0.1:0.34,ease:[0.22,1,0.36,1]}} drag={reduceMotion?false:'x'} dragConstraints={{left:0,right:0}} dragElastic={{left:0.05,right:0.55}} onDragEnd={(_,info)=>{if(info.offset.x < -70||info.velocity.x < -500)setDrawerOpen(false)}}><motion.div className="flex h-20 items-center justify-between border-b border-border px-6" initial={reduceMotion?false:{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:reduceMotion?0:0.08,duration:0.22}}><TraceLogo width={162} height={54} className="-ml-[4.9px] max-w-none"/><Tooltip content="Close navigation"><button onClick={()=>setDrawerOpen(false)} aria-label="Close navigation menu" className="flex size-9 items-center justify-center rounded-md hover:bg-muted"><X className="size-5"/></button></Tooltip></motion.div><motion.div className="border-b border-border p-4" initial={reduceMotion?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:reduceMotion?0:0.11,duration:0.2}}><div className="flex items-center gap-3 rounded-lg bg-muted/45 p-3"><span className="flex size-9 items-center justify-center rounded-md border border-border bg-background"><Building2 className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Oak &amp; Pixel</p><p className="mt-0.5 text-[10px] text-muted-foreground">Current organisation</p></div></div></motion.div><nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-3"><ul className="space-y-1">{DASHBOARD_NAVIGATION.map((item,index)=>{const active=pathname===item.href||pathname.startsWith(`${item.href}/`);return <motion.li key={item.href} initial={reduceMotion?false:{opacity:0,x:-7}} animate={{opacity:1,x:0}} transition={{delay:reduceMotion?0:0.12+index*0.025,duration:0.2}}><Link href={item.href} onClick={()=>setDrawerOpen(false)} className={`flex h-11 items-center justify-between rounded-lg px-3 text-sm ${active?'bg-brand-muted font-semibold text-brand':'hover:bg-muted'}`}><span>{item.label}</span><ChevronRight className="size-4 text-muted-foreground"/></Link></motion.li>})}</ul></nav><motion.div className="border-t border-border p-3" initial={reduceMotion?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:reduceMotion?0:0.2,duration:0.22}}><Link href="/settings/profile" onClick={()=>setDrawerOpen(false)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{currentUser.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{currentUser.name}</span><span className="block truncate text-[10px] text-muted-foreground">{currentUser.email}</span></span><UserRound className="size-4 text-muted-foreground"/></Link><button onClick={()=>{setDrawerOpen(false);setSignOutOpen(true)}} className="mt-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-semibold text-destructive hover:bg-muted"><LogOut className="size-4"/> Sign Out</button></motion.div></motion.aside></motion.div>}</AnimatePresence>
      <ConfirmActionDialog open={signOutOpen} onClose={()=>setSignOutOpen(false)} onConfirm={()=>{setSignOutOpen(false);router.push('/sign-in')}} title="Sign Out?" description="You will return to the TRACE sign-in page. Any unsaved changes will be lost." confirmLabel="Sign Out" destructive/>
    </header>
  )
}

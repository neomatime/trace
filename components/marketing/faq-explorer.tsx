'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Grid2X2, Search } from 'lucide-react'
import { FAQ_ITEMS } from '@/config/public-site'
import { cn } from '@/lib/utils'

const categories=['All Questions','Getting Started','Plans & Pricing','Features','Audits','Reports','Data & Security','Account & Billing'] as const

export function FaqExplorer(){
 const [category,setCategory]=useState<(typeof categories)[number]>('All Questions')
 const [query,setQuery]=useState('')
 const [open,setOpen]=useState<string>(FAQ_ITEMS[0].question)
 const filtered=useMemo(()=>FAQ_ITEMS.filter(item=>(category==='All Questions'||item.category===category)&&(`${item.question} ${item.answer}`.toLowerCase().includes(query.toLowerCase()))),[category,query])
 const count=(value:(typeof categories)[number])=>value==='All Questions'?FAQ_ITEMS.length:FAQ_ITEMS.filter(item=>item.category===value).length
 return <>
  <div className="relative mx-auto mt-8 max-w-xl"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for answers..." aria-label="Search frequently asked questions" className="h-13 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"/></div>
  <div className="mt-12 grid items-start gap-6 lg:grid-cols-[260px_1fr]"><aside className="overflow-hidden rounded-xl border border-border" aria-label="FAQ categories">{categories.map(value=><button type="button" key={value} onClick={()=>setCategory(value)} aria-pressed={category===value} className={cn('flex w-full items-center justify-between border-b border-border px-5 py-4 text-left text-sm font-semibold last:border-0 hover:bg-muted/40',category===value&&'bg-brand-muted text-brand')}><span className="inline-flex items-center gap-3"><Grid2X2 className="size-4"/>{value}</span><span className="text-xs">{count(value)}</span></button>)}<div className="border-t border-border bg-muted/20 p-6 text-center"><p className="text-sm font-bold">Still have questions?</p><p className="mt-2 text-xs text-muted-foreground">Our support team is here to help.</p><a href="mailto:hello@trace.co.za" className="mt-5 inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-xs font-semibold hover:border-brand">Contact Support →</a></div></aside>
  <div className="overflow-hidden rounded-xl border border-border">{filtered.length?filtered.map(item=>{const isOpen=open===item.question;return <article key={item.question} className="border-b border-border last:border-0"><h2><button type="button" onClick={()=>setOpen(isOpen?'':item.question)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left text-sm font-bold hover:bg-muted/30 sm:px-6">{item.question}<ChevronDown className={cn('size-5 shrink-0 transition-transform duration-200',isOpen&&'rotate-180')}/></button></h2>{isOpen&&<div className="px-5 pb-6 sm:px-6"><p className="max-w-3xl text-sm leading-6 text-muted-foreground">{item.answer}</p></div>}</article>}):<div className="p-10 text-center"><p className="font-semibold">No answers found</p><p className="mt-2 text-sm text-muted-foreground">Try a different search term or category.</p></div>}</div>
  </div>
 </>
}

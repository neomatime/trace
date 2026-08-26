'use client'

import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { FAQ_ITEMS, PLANS } from '@/config/public-site'
import { cn } from '@/lib/utils'
import { MarketingButton } from './marketing-ui'

const comparison = [
  { label:'Active client organisations', values:['3','10','25'] },
  { label:'Users included', values:['Standard','More users','Highest limits'] },
  { label:'Audits per month', values:['Core allowance','Higher allowance','Highest allowance'] },
  { label:'Storage', values:['Standard','More storage','Highest storage'] },
  { label:'All audit types', values:[true,true,true] },
  { label:'Evidence management', values:[true,true,true] },
  { label:'Frameworks & templates', values:[true,true,true] },
  { label:'Reassessments', values:[false,true,true] },
  { label:'Custom frameworks', values:[false,true,true] },
  { label:'Export reports', values:[true,true,true] },
  { label:'API access', values:[false,false,'Available'] },
  { label:'Priority support', values:[false,true,true] },
] as const

export function PricingView(){
  const [billing,setBilling]=useState<'monthly'|'annual'>('monthly')
  const pricingFaq=FAQ_ITEMS.filter(item=>['Can I change or cancel my plan later?','What happens if I exceed my limits?','Is there a long-term contract?','Do you offer refunds?','Can I get a demo?'].includes(item.question))
  return <>
    <div className="mx-auto mt-8 flex w-fit rounded-xl border border-border bg-muted/30 p-1" role="group" aria-label="Billing frequency"><button type="button" onClick={()=>setBilling('monthly')} aria-pressed={billing==='monthly'} className={cn('min-w-28 rounded-lg px-5 py-3 text-sm font-semibold transition-colors',billing==='monthly'&&'bg-white shadow-sm')}>Monthly</button><button type="button" onClick={()=>setBilling('annual')} aria-pressed={billing==='annual'} className={cn('min-w-28 rounded-lg px-5 py-3 text-sm font-semibold transition-colors',billing==='annual'&&'bg-white shadow-sm')}>Annual<span className="block text-[10px] font-medium text-brand">Save up to 20%</span></button></div>
    <p className="mt-3 text-center text-xs text-muted-foreground">{billing==='monthly'?'Billed monthly':'Annual billing selected. Final annual terms are confirmed before purchase.'}</p>
    <div className="mt-10 grid gap-5 lg:grid-cols-3">{PLANS.map(plan=><article key={plan.id} className={cn('relative flex flex-col rounded-xl border bg-white p-7',plan.popular?'border-brand ring-1 ring-brand':'border-border')}>{plan.popular&&<div className="absolute inset-x-0 -top-3 mx-auto w-fit rounded-full bg-brand px-5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-white">Most Popular</div>}<h2 className="text-lg font-bold">{plan.name}</h2><p className="mt-2 text-sm text-muted-foreground">{plan.audience}</p><div className="mt-6 flex items-end gap-1"><strong className="text-3xl">{plan.price}</strong><span className="pb-1 text-sm text-muted-foreground">/ month</span></div><p className="mt-2 text-xs text-muted-foreground">{billing==='annual'?'Shown at the standard monthly rate':'Billed monthly'}</p><ul className="mt-6 flex-1 space-y-3 border-t border-border pt-5"><li className="flex gap-2 text-sm font-semibold"><Check className="size-4 text-brand"/>{plan.clients}</li>{plan.benefits.map(item=><li key={item} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-brand"/>{item}</li>)}</ul><MarketingButton href={`/sign-up?plan=${plan.id}`} variant={plan.popular?'primary':'outline'} className="mt-7 w-full">Get Started</MarketingButton></article>)}</div>
    <section className="mt-16"><h2 className="text-2xl font-bold">Compare plans</h2><p className="mt-2 text-sm text-muted-foreground">A clear view of the current standard plan structure.</p><div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="bg-muted/40"><th className="px-5 py-4">Capability</th>{PLANS.map(plan=><th key={plan.id} className={cn('px-5 py-4 text-center',plan.popular&&'border-x border-brand/35 text-brand')}>{plan.name}{plan.popular&&<span className="mt-1 block text-[9px] uppercase tracking-wider">Most Popular</span>}</th>)}</tr></thead><tbody>{comparison.map(row=><tr key={row.label} className="border-t border-border"><th className="px-5 py-3 font-medium">{row.label}</th>{row.values.map((value,index)=><td key={index} className={cn('px-5 py-3 text-center text-muted-foreground',index===1&&'border-x border-brand/25')}>{value===true?<Check className="mx-auto size-4 text-brand"/>:value===false?<Minus className="mx-auto size-4 text-muted-foreground"/>:value}</td>)}</tr>)}</tbody></table></div><p className="mt-4 text-center text-xs text-muted-foreground">Secondary operating limits are configurable and will be confirmed before subscription.</p></section>
    <section className="mt-16"><h2 className="text-center text-2xl font-bold">Frequently asked questions</h2><div className="mt-7 grid gap-3 md:grid-cols-2">{pricingFaq.map(item=><details key={item.question} className="group rounded-lg border border-border p-5 open:bg-muted/20"><summary className="cursor-pointer list-none pr-8 text-sm font-semibold marker:hidden">{item.question}<span className="float-right text-xl font-light group-open:rotate-45">+</span></summary><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}</div></section>
  </>
}

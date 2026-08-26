import Link from 'next/link'
import { ArrowRight, BarChart3, Check, CircleCheck, ClipboardCheck, FileText, Paperclip, Layers3, LineChart, SearchCheck, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PLANS } from '@/config/public-site'
import { cn } from '@/lib/utils'

export const marketingContainer = 'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10'

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) { return <p className={cn('text-xs font-bold uppercase tracking-[.14em] text-brand', className)}>{children}</p> }

export function MarketingButton({ href, children, variant = 'primary', className }: { href: string; children: React.ReactNode; variant?: 'primary' | 'outline' | 'text'; className?: string }) {
  return <Link href={href} className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2', variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/85', variant === 'outline' && 'border border-border bg-white hover:bg-muted', variant === 'text' && 'text-brand hover:bg-brand-muted', className)}>{children}{variant === 'text' && <ArrowRight className="size-4" />}</Link>
}

export function HeroActions({ secondary = 'Sign In', secondaryHref = '/sign-in' }: { secondary?: string; secondaryHref?: string }) { return <div className="mt-7 flex flex-wrap gap-3"><MarketingButton href="/sign-up">Get Started</MarketingButton><MarketingButton href={secondaryHref} variant="outline">{secondary}</MarketingButton></div> }

export function TrustStrip() { return <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">{['Secure & Compliant','Built for Consulting Firms','Trusted by Professionals'].map((item) => <span key={item} className="inline-flex items-center gap-2"><CircleCheck className="size-4 text-foreground" />{item}</span>)}</div> }

const miniAudits = [
  ['Website Audit','82','Completed'], ['Digital Presence Audit','74','In Progress'], ['Brand Consistency Audit','91','Completed'], ['Operational Flow Audit','68','In Review'],
]

export function ProductPreview({ mode = 'dashboard', className }: { mode?: 'dashboard' | 'features' | 'report' | 'diagnose' | 'capture' | 'improve' | 'measure'; className?: string }) {
  const reportMode = mode === 'report' || mode === 'measure'
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-white shadow-[0_18px_60px_rgba(15,23,42,.08)]', className)}>
      <div className="flex min-h-[330px]">
        <aside className="hidden w-28 shrink-0 border-r border-border bg-muted/35 p-3 sm:block"><div className="text-[10px] font-bold tracking-[.3em]">TRACE</div><div className="mt-7 space-y-2">{['Audits','History','Templates','Frameworks','Evidence','Reports'].map((item, index) => <div key={item} className={cn('rounded-md px-2 py-2 text-[9px] text-muted-foreground', (reportMode ? index === 5 : index === 0) && 'bg-brand-muted font-semibold text-brand')}>{item}</div>)}</div></aside>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] text-muted-foreground">Audit workspace</p><h3 className="mt-1 text-sm font-bold">{reportMode ? 'Website Audit Report' : mode === 'capture' ? 'Evidence' : mode === 'improve' ? 'Findings' : mode === 'diagnose' ? 'New Audit' : 'Audit Overview'}</h3></div><span className="rounded-md border border-border px-2 py-1 text-[9px]">20 Aug 2026</span></div>
          {mode === 'capture' ? <EvidenceMini /> : mode === 'improve' ? <FindingsMini /> : mode === 'diagnose' ? <AuditTypeMini /> : <>
            <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">{(reportMode ? [['Audit Score','78'],['Critical','5'],['High','12'],['Recommendations','24']] : [['Overall Score','82%'],['Requirements','126 / 150'],['High Risk Findings','7'],['Evidence Items','248']]).map(([label,value]) => <div key={label} className="rounded-lg border border-border p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-2 text-lg font-bold">{value}</p>{label.includes('Score') && <p className="mt-1 text-[8px] text-success">↑ 14 vs previous audit</p>}</div>)}</div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_.75fr]">
              <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-semibold">{reportMode ? 'Score Trend' : 'Recent Audits'}</p>{reportMode ? <TrendChart /> : <div className="mt-2 divide-y divide-border">{miniAudits.slice(0,3).map(([name,score,status]) => <div key={name} className="grid grid-cols-[1fr_35px_55px] items-center gap-2 py-2 text-[8px]"><span className="truncate">{name}</span><strong>{score}</strong><span className="rounded bg-success-muted px-1 py-0.5 text-center text-success">{status}</span></div>)}</div>}</div>
              <div className="rounded-lg border border-border p-3"><p className="text-[10px] font-semibold">{reportMode ? 'Audit Summary' : 'Score Trend'}</p>{reportMode ? <dl className="mt-3 space-y-3 text-[8px]">{[['Client','Oak & Pixel'],['Framework','TRACE Web v2'],['Auditor','Alex Reed'],['Status','Completed']].map(([a,b]) => <div className="flex justify-between gap-3" key={a}><dt className="text-muted-foreground">{a}</dt><dd className="font-medium">{b}</dd></div>)}</dl> : <TrendChart />}</div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

function TrendChart() { return <svg viewBox="0 0 210 100" className="mt-3 h-24 w-full" role="img" aria-label="Audit score trend improving from 30 to 82"><path d="M8 80 L42 62 L76 67 L108 42 L142 48 L176 25 L202 18" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand"/><path d="M8 80 L42 62 L76 67 L108 42 L142 48 L176 25 L202 18 L202 94 L8 94Z" fill="currentColor" className="text-brand/10"/>{[8,42,76,108,142,176,202].map((x,i)=><circle key={x} cx={x} cy={[80,62,67,42,48,25,18][i]} r="2.5" fill="currentColor" className="text-brand"/>)}</svg> }

function EvidenceMini() { return <div className="mt-5 overflow-hidden rounded-lg border border-border"><div className="grid grid-cols-[1fr_1fr_70px] bg-muted/50 px-3 py-2 text-[9px] font-semibold"><span>Evidence</span><span>Linked to</span><span>Status</span></div>{[['Homepage performance','Requirement 1.2','Validated'],['Navigation screenshot','Requirement 2.4','Review'],['Analytics export','Requirement 3.1','Validated'],['Interview notes','Requirement 4.2','Draft']].map((row) => <div key={row[0]} className="grid grid-cols-[1fr_1fr_70px] border-t border-border px-3 py-3 text-[9px]"><span className="font-medium">{row[0]}</span><span className="text-muted-foreground">{row[1]}</span><span className="text-brand">{row[2]}</span></div>)}</div> }
function FindingsMini() { return <div className="mt-5"><div className="grid grid-cols-3 gap-2">{[['Critical','5'],['High','12'],['Medium','18']].map(([a,b]) => <div key={a} className="rounded-lg border border-border p-3"><p className="text-[9px] text-muted-foreground">{a}</p><strong>{b}</strong></div>)}</div><div className="mt-3 overflow-hidden rounded-lg border border-border">{['Missing meta descriptions','Inconsistent logo usage','Slow server response'].map((item,i)=><div key={item} className="flex items-center justify-between border-b border-border px-3 py-3 text-[9px] last:border-0"><span>{item}</span><span className="text-brand">{i ? 'Medium' : 'High'}</span></div>)}</div></div> }
function AuditTypeMini() { return <div className="mt-5"><p className="text-[10px] font-semibold">Select audit type</p><div className="mt-3 grid grid-cols-2 gap-2">{['Website Audit','Digital Presence Audit','Brand Consistency Audit','Operational Flow Audit'].map((item)=><div key={item} className="rounded-lg border border-border p-3 text-[9px] font-medium hover:border-brand"><ClipboardCheck className="mb-2 size-4 text-brand"/>{item}</div>)}</div></div> }

const valueIcons: LucideIcon[] = [ClipboardCheck, Paperclip, Layers3, LineChart]
export function ValueStrip({ items }: { items: readonly { title: string; description: string }[] }) { return <div className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-4">{items.map((item,index)=>{const Icon=valueIcons[index%valueIcons.length];return <div key={item.title} className="flex gap-4 border-b border-border p-5 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:last:border-r-0"><span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border"><Icon className="size-5 text-brand"/></span><div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></div></div>})}</div> }

export function PricingCards({ compact = false }: { compact?: boolean }) { return <div className="grid gap-4 lg:grid-cols-3">{PLANS.map((plan)=><article key={plan.id} className={cn('relative rounded-xl border bg-white p-6',plan.popular?'border-brand ring-1 ring-brand':'border-border',compact&&'p-5')}>{plan.popular&&<span className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Most Popular</span>}<p className="text-sm font-semibold">{plan.name}</p><div className="mt-3 flex items-end gap-1"><strong className={cn('text-3xl',compact&&'text-2xl')}>{plan.price}</strong><span className="pb-1 text-xs text-muted-foreground">/ month</span></div><p className="mt-2 text-sm text-muted-foreground">{compact?plan.clients:plan.audience}</p>{!compact&&<ul className="mt-6 space-y-3 border-t border-border pt-5">{plan.benefits.map((benefit)=><li key={benefit} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-brand"/>{benefit}</li>)}</ul>}<MarketingButton href="/sign-up" variant={plan.popular?'primary':'outline'} className="mt-6 w-full">Get Started</MarketingButton></article>)}</div> }

export function SectionHeading({ eyebrow, title, description, align = 'center', as: Heading = 'h2' }: { eyebrow?: string; title: string; description?: string; align?: 'center' | 'left'; as?: 'h1' | 'h2' }) { return <div className={cn('max-w-2xl',align==='center'&&'mx-auto text-center')}>{eyebrow&&<Eyebrow>{eyebrow}</Eyebrow>}<Heading className="mt-3 whitespace-pre-line text-3xl font-bold tracking-tight sm:text-4xl">{title}</Heading>{description&&<p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>}</div> }

export function FinalCta({ title, description }: { title: string; description?: string }) { return <section className={cn(marketingContainer,'py-16')}><div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-border bg-muted/20 px-6 py-9 text-center lg:flex-row lg:text-left"><div><h2 className="text-2xl font-bold">{title}</h2>{description&&<p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div><div className="flex shrink-0 gap-3"><MarketingButton href="/sign-up">Get Started</MarketingButton><MarketingButton href="/sign-in" variant="text">Sign in</MarketingButton></div></div></section> }

export const featureIcons = { audits: ClipboardCheck, evidence: Paperclip, frameworks: Layers3, findings: SearchCheck, tracking: BarChart3, reports: FileText, security: ShieldCheck }

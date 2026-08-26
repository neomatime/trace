import { ArrowRight } from 'lucide-react'
import { FinalCta, HeroActions, PricingCards, ProductPreview, TrustStrip, ValueStrip, marketingContainer } from '@/components/marketing/marketing-ui'

const values = [
  { title: 'Run structured audits', description: 'Create consistent, repeatable audits across clients and frameworks.' },
  { title: 'Capture evidence', description: 'Collect, organise and link evidence directly to requirements.' },
  { title: 'Standardise frameworks', description: 'Use proven templates and customise your methodology.' },
  { title: 'Measure improvement', description: 'Track performance over time and prove real client progress.' },
]
const steps = [
  ['Diagnose','Assess current state and identify gaps against the standard.'],['Capture','Collect evidence and map it directly to requirements.'],['Improve','Address findings and track actions to completion.'],['Measure','Re-audit, compare results and demonstrate improvement.'],
] as const

export default function HomePage() {
  return <>
    <section className="border-b border-border bg-[radial-gradient(circle_at_70%_20%,rgba(240,91,36,.035),transparent_30%)]"><div className={`${marketingContainer} grid items-center gap-12 py-16 lg:grid-cols-[.8fr_1.2fr] lg:py-24`}><div><h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-[-.035em] sm:text-5xl lg:text-[3.4rem]">The audit system built for modern consulting firms</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Standardise audits, capture evidence, manage frameworks, and continuously improve client performance.</p><HeroActions /><TrustStrip /></div><ProductPreview /></div></section>
    <section className={`${marketingContainer} py-10`}><ValueStrip items={values} /></section>
    <section className={`${marketingContainer} py-12`}><h2 className="text-xl font-bold">How it works</h2><div className="mt-5 grid gap-4 lg:grid-cols-4">{steps.map(([title,description],index)=><div key={title} className="relative flex gap-4 rounded-xl border border-border p-5"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-brand text-sm font-bold text-brand">{index+1}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>{index<steps.length-1&&<ArrowRight className="absolute -right-7 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-muted-foreground lg:block"/>}</div>)}</div></section>
    <section className={`${marketingContainer} py-12`}><div className="mb-6 flex items-end justify-between gap-5"><div><h2 className="text-2xl font-bold">Simple pricing for serious audit teams</h2><p className="mt-2 text-sm text-muted-foreground">Choose the standard plan that matches the scale of your practice.</p></div></div><PricingCards compact /></section>
    <FinalCta title="Start building a better audit practice with TRACE" />
  </>
}

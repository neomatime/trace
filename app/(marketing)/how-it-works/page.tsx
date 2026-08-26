import { BarChart3, Clock3, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { FinalCta, HeroActions, ProductPreview, SectionHeading, ValueStrip, marketingContainer } from '@/components/marketing/marketing-ui'

const workflow = [
  { number:'01', title:'Diagnose', description:'Select an audit type, choose a framework or template, and define the scope. TRACE guides you through a structured audit process.', mode:'diagnose' as const },
  { number:'02', title:'Capture', description:'Collect findings, evidence and context as you audit. Add screenshots, files, notes, URLs and descriptions to support every observation.', mode:'capture' as const },
  { number:'03', title:'Improve', description:'TRACE turns findings into clear recommendations and actions. Prioritise what matters and assign next steps.', mode:'improve' as const },
  { number:'04', title:'Measure', description:'Reassess over time and track progress with scores, trends and historical data. Prove improvement and demonstrate impact.', mode:'measure' as const },
]
const values=[
  {title:'Continuous Improvement',description:'Never stop improving. TRACE helps you close the loop.'},
  {title:'Consistency at Scale',description:'Standardise your methodology and deliver consistent audits.'},
  {title:'More Value for Clients',description:'Clear insights and measurable results build trust.'},
  {title:'Save Time',description:'Streamlined workflows reduce manual work.'},
]

export default function HowItWorksPage(){return <>
  <section className="border-b border-border"><div className={`${marketingContainer} grid items-center gap-12 py-16 lg:grid-cols-[.7fr_1.3fr] lg:py-20`}><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">How TRACE works</p><h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">A better audit process.<br/>From start to finish.</h1><p className="mt-5 text-base leading-7 text-muted-foreground">TRACE gives consulting firms a structured, repeatable audit workflow that drives clarity, consistency and measurable improvement for every client.</p><HeroActions secondary="See TRACE in action" secondaryHref="#process"/></div><ProductPreview/></div></section>
  <section id="process" className={`${marketingContainer} py-20`}><SectionHeading eyebrow="The TRACE process" title="Four steps. One continuous loop." description="TRACE follows a simple but powerful cycle that helps you deliver consistent, high-quality audits and drive real improvement for your clients."/><div className="relative mx-auto mt-12 max-w-5xl space-y-6 before:absolute before:bottom-10 before:left-[25px] before:top-10 before:w-px before:bg-border sm:before:left-[31px]">{workflow.map((step)=><article key={step.number} className="relative grid gap-5 pl-16 lg:grid-cols-[250px_1fr]"><div className="absolute left-0 top-7 z-10 inline-flex size-13 items-center justify-center rounded-full border border-brand bg-white text-sm font-bold text-brand sm:size-16"><RefreshCw className="size-6"/></div><div className="rounded-xl border border-border bg-white p-6"><p className="text-xs font-bold text-brand">{step.number}</p><h2 className="mt-2 text-xl font-bold">{step.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p></div><ProductPreview mode={step.mode} className="shadow-none"/></article>)}</div></section>
  <section className="bg-muted/20 py-12"><div className={marketingContainer}><ValueStrip items={values}/></div></section>
  <FinalCta title="Ready to streamline your audit process?" description="Get started with TRACE and transform the way you audit, improve and deliver value."/>
  <span className="sr-only"><BarChart3/><Clock3/><ShieldCheck/><Users/></span>
  </>}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, Globe2, LayoutTemplate, Network, Save, Settings2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getAuditType, getAuditTypeByName } from '@/config/audit-types'
import { templates } from '@/data/mock/templates'
import { AuditDetailsStep, AuditReviewStep, AuditScopeStep, AuditTypeStep, FrameworkStep, TeamStep, type WizardState } from './audit-wizard-steps'

const steps = [['Audit Type', Globe2], ['Audit Details', FileText], ['Scope', Network], ['Framework', LayoutTemplate], ['Team', Settings2], ['Review', ClipboardCheck]] as const
const mockAuditIds: Record<string, string> = { website: 'TRC-WEB-2026-0042', brand: 'TRC-BRN-2026-0021', 'digital-presence': 'TRC-DIG-2026-0018', 'operational-flow': 'TRC-OF-2026-0012', 'customer-experience': 'TRC-CX-2026-0001', people: 'TRC-PPL-2026-0001', intelligence: 'TRC-INT-2026-0001' }
const frameworkByType: Record<string, string> = { website: 'fwk-web-001', brand: 'fwk-brn-001', 'digital-presence': 'fwk-dig-001', 'operational-flow': 'fwk-of-001' }

function defaultState(): WizardState {
  return {
    typeId: 'website',
    values: {
      auditName: 'Oak & Pixel Website — Aug 2026', organisation: 'Oak & Pixel',
      objective: 'Assess the website experience and identify prioritised improvements.', owner: 'Alex Reed', priority: 'Medium',
      websiteUrl: 'https://oakandpixel.co.za', primaryDomain: 'oakandpixel.co.za', startUrl: 'https://oakandpixel.co.za',
      devices: ['Mobile Audit', 'Desktop Audit'], maximumPages: '250', crawlDepth: '3',
    },
    frameworkId: 'fwk-web-001', assignments: { u1: 'Audit Lead', u3: 'Reviewer' },
  }
}

function stateForTemplate(name: string): WizardState {
  const template = templates.find(item => item.name === name || item.id === name) || templates[0]
  const type = getAuditTypeByName(template.auditType)
  const common = { auditName: `Oak & Pixel ${type.name.replace(' Audit', '')} — Aug 2026`, organisation: 'Oak & Pixel', objective: 'Complete a consistent assessment using the selected template defaults.', owner: 'Alex Reed', priority: 'Medium' }
  const scopes: Record<string, Record<string, string | string[]>> = {
    website: { websiteUrl: 'https://oakandpixel.co.za', primaryDomain: 'oakandpixel.co.za', startUrl: 'https://oakandpixel.co.za', crawlDepth: '3', maximumPages: '250', devices: ['Mobile Audit', 'Desktop Audit'], crawlOptions: [] },
    brand: { brandName: 'Oak & Pixel', touchpoints: ['Logo', 'Brand Guidelines', 'Colour System', 'Typography', 'Messaging', 'Website', 'Social Media'], markets: [], locations: [], businessUnits: [] },
    'digital-presence': { primaryBrand: 'Oak & Pixel', channels: ['Website', 'Google Business Profile', 'Google Search', 'LinkedIn', 'Instagram'], geographicMarket: 'South Africa', competitors: [], keywords: [] },
    'operational-flow': { processName: 'Purchase-to-Pay', processOwner: 'Head of Procurement', startPoint: 'Purchase request submitted', endPoint: 'Supplier payment completed', departments: [], roles: [], systems: [], inputs: [], outputs: [], controls: [], dependencies: [], locations: [] },
    'customer-experience': { journeyName: 'Customer onboarding', experienceOwner: 'Head of Customer Experience', primaryAudience: 'New business customers', touchpoints: ['Website','Email','Support'], journeyStages: [], customerSegments: [], channels: [], locations: [] },
    people: { peopleScope: 'Corporate workforce', peopleOwner: 'Head of People', businessUnit: 'All business units', peoplePractices: ['Recruitment','Onboarding','Performance'], departments: [], workforceGroups: [], locations: [], systems: [] },
    intelligence: { intelligenceObjective: 'Improve commercial decision support', informationOwner: 'Head of Strategy & Insights', decisionDomain: 'Customer and market decisions', informationSources: ['Operational Systems','Customer Data','Market Research'], decisionUseCases: [], systems: [], stakeholders: [], outputs: [] },
  }
  return { typeId: type.id, values: { ...common, ...scopes[type.id] }, frameworkId: frameworkByType[type.id] || '', assignments: { u1: 'Audit Lead', u3: 'Reviewer' } }
}

function validateStep(step: number, state: WizardState) {
  const errors: string[] = []
  if (step === 1) {
    const required = [['auditName', 'Enter an audit name.'], ['organisation', 'Select an organisation.'], ['objective', 'Describe the audit objective.'], ['owner', 'Select an audit owner.']] as const
    required.forEach(([field, message]) => { if (!String(state.values[field] || '').trim()) errors.push(message) })
    getAuditType(state.typeId).detailFields.filter(field => 'required' in field && field.required).forEach(field => { if (!String(state.values[field.id] || '').trim()) errors.push(`Complete ${field.label.toLowerCase()}.`) })
  }
  if (step === 2) {
    getAuditType(state.typeId).scopeFields.filter(field => 'required' in field && field.required).forEach(field => {
      const value = state.values[field.id]
      if (!value || (Array.isArray(value) && value.length === 0)) errors.push(`Complete ${field.label.toLowerCase()}.`)
    })
  }
  return errors
}

export function NewAuditWizard() {
  const router = useRouter()
  const params = useSearchParams()
  const requested = params.get('template')
  const initialTemplate = templates.find(item => item.id === requested)?.name || (requested === 'tpl-web-001' ? 'Website Audit v1.0' : '')
  const [appliedTemplate, setAppliedTemplate] = useState(initialTemplate)
  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftStatus, setDraftStatus] = useState('All changes are stored locally in this prototype.')
  const [announcement, setAnnouncement] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [state, setState] = useState<WizardState>(() => initialTemplate ? stateForTemplate(initialTemplate) : defaultState())

  const update = (patch: Partial<WizardState>) => { setState(current => ({ ...current, ...patch })); setValidationErrors([]); setDraftStatus('Unsaved changes') }
  const applyTemplate = (name: string) => {
    if (!name) { setAppliedTemplate(''); return }
    setState(stateForTemplate(name)); setAppliedTemplate(name); setValidationErrors([]); setAnnouncement(`Template applied: ${name}`)
  }
  const next = () => {
    const errors = validateStep(step, state)
    if (errors.length) { setValidationErrors(errors); setAnnouncement(`${errors.length} required ${errors.length === 1 ? 'item needs' : 'items need'} attention.`); return }
    if (step < 5) { setValidationErrors([]); setStep(step + 1); setAnnouncement(`Moved to ${steps[step + 1][0]}`) }
  }
  const back = () => { if (step > 0) { setValidationErrors([]); setStep(step - 1); setAnnouncement(`Moved back to ${steps[step - 1][0]}`) } }
  const saveDraft = () => {
    setSaving(true); setDraftStatus('Saving draft…')
    window.setTimeout(() => { setSaving(false); setDraftStatus('Draft saved just now'); setAnnouncement('Audit draft saved') }, 450)
  }
  const create = () => {
    const errors = [...validateStep(1, state), ...validateStep(2, state)]
    if (errors.length) { setValidationErrors(errors); setAnnouncement('The audit cannot be created until required details are complete.'); return }
    setCreating(true); setAnnouncement('Creating audit workspace'); window.setTimeout(() => router.push(`/audits/${mockAuditIds[state.typeId]}`), 500)
  }

  const content = [<AuditTypeStep key="type" state={state} update={update} />, <AuditDetailsStep key="details" state={state} update={update} />, <AuditScopeStep key="scope" state={state} update={update} />, <FrameworkStep key="framework" state={state} update={update} />, <TeamStep key="team" state={state} update={update} />, <AuditReviewStep key="review" state={state} onEdit={setStep} />][step]
  const remaining = 5 - step

  return (
    <div className="mx-auto max-w-6xl py-2">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Create New Audit</h1><p className="mt-1 text-xs text-muted-foreground">A guided setup for {getAuditType(state.typeId).name}.</p></div>
        <div className="text-right"><p className="text-xs font-semibold">Step {step + 1} of 6 · {steps[step][0]}</p><p className="mt-1 text-[10px] text-muted-foreground">{remaining ? `${remaining} ${remaining === 1 ? 'step' : 'steps'} remaining` : 'Ready to create'}</p></div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Audit setup progress" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1}><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((step + 1) / 6) * 100}%` }} /></div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
      {appliedTemplate && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/25 bg-brand-muted/20 px-4 py-3"><div><p className="text-xs font-semibold text-brand">Template applied: {appliedTemplate}</p><p className="mt-1 text-[10px] text-muted-foreground">Framework, scope and team defaults are prefilled and remain editable.</p></div><button onClick={() => setAppliedTemplate('')} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand"><X className="size-3" /> Remove Template</button></div>}
      <Card className="overflow-hidden">
        <div className="grid min-h-[650px] md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-muted/35 p-4 md:border-b-0 md:border-r md:p-6">
            <div className="mb-4 flex items-center justify-between md:mb-6"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Audit setup</p><span className="text-[10px] text-muted-foreground md:hidden">{steps[step][0]}</span></div>
            <div className="grid grid-cols-6 gap-1 md:block md:space-y-1">
              {steps.map(([label, Icon], index) => <button key={label} onClick={() => index <= step && setStep(index)} disabled={index > step} aria-current={index === step ? 'step' : undefined} aria-label={`Step ${index + 1}: ${label}`} className={`flex items-center justify-center rounded-md px-2 py-2 text-xs md:w-full md:justify-start md:gap-3 md:px-3 md:py-3 ${index === step ? 'bg-white font-semibold text-brand shadow-sm' : index < step ? 'text-foreground' : 'text-muted-foreground'}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${index === step ? 'bg-brand text-white' : index < step ? 'bg-success text-white' : 'border border-border bg-white'}`}>{index < step ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}</span><span className="hidden md:block"><span className="block">{label}</span><span className="mt-0.5 block text-[9px] font-normal text-muted-foreground">Step {index + 1} of 6</span></span></button>)}
            </div>
          </aside>
          <main onChangeCapture={event => { const target = event.target as HTMLSelectElement; if (target.getAttribute('aria-label') === 'Start from a template') applyTemplate(target.value) }} className="flex min-w-0 flex-col">
            <div key={`${state.typeId}-${step}`} className="flex-1 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 sm:p-6 md:p-10">
              {validationErrors.length > 0 && <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-destructive"><AlertCircle className="size-4" /> Complete the required information</div><ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-destructive">{validationErrors.map(error => <li key={error}>{error}</li>)}</ul></div>}
              {content}
            </div>
            <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 md:px-10">
              <div className="flex items-center gap-2">{step === 0 ? <button onClick={() => router.push('/audits')} className="inline-flex h-9 items-center rounded-md border border-border px-4 text-xs font-semibold">Cancel</button> : <button onClick={back} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-xs font-semibold"><ArrowLeft className="size-3.5" /> Back</button>}<button onClick={saveDraft} disabled={saving} aria-label="Save Draft" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold disabled:opacity-60"><Save className="size-3.5" /> <span className="hidden sm:inline">Save Draft</span></button></div>
              <div className="flex min-w-0 items-center gap-3"><span className="hidden text-[10px] text-muted-foreground lg:inline">{draftStatus}</span>{step < 5 ? <button onClick={next} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground">Next: {steps[step + 1][0]} <ArrowRight className="size-3.5" /></button> : <button onClick={create} disabled={creating} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60">{creating ? 'Creating Audit…' : 'Create Audit'} <ArrowRight className="size-3.5" /></button>}</div>
            </footer>
          </main>
        </div>
      </Card>
    </div>
  )
}

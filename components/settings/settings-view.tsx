'use client'

import { useState } from 'react'
import {
  Archive,
  Building2,
  CalendarDays,
  Check,
  CircleGauge,
  Database,
  Globe2,
  Hash,
  Languages,
  LayoutList,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { SystemStatusBar } from '@/components/layout/system-status-bar'
import { Card, PanelHeader, StatRow } from '@/components/ui/card'
import { SelectMenu } from '@/components/ui/filter-bar'
import { PageTabs } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SettingsSection } from './settings-section'
import { ConfirmActionDialog, CrudFormDialog, CrudToast } from '@/components/ui/crud'

const TABS = [
  'Organisation',
  'Team & Users',
  'Audit Defaults',
  'Integrations',
  'Notifications',
  'Security',
  'Billing & Plan',
  'System',
]

export function SettingsView({ initialTab = 'Organisation' }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState('Light')
  const [items, setItems] = useState('10')
  const [landing, setLanding] = useState('Audits')
  const [autoSave, setAutoSave] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [orgEditor,setOrgEditor]=useState<'profile'|'details'|'storage'|'retention'|null>(null)
  const [danger,setDanger]=useState<'archive'|'delete'|null>(null)
  const [toast,setToast]=useState('')

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your organisation, team, audit defaults and TRACE system preferences."
      />

      <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="-mt-2 mb-5" />

      {activeTab === 'Organisation' ? <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(340px,0.96fr)_minmax(420px,1.09fr)_minmax(270px,0.67fr)]">
        <div className="grid min-w-0 gap-4">
          <Card>
            <PanelHeader title="Organisation Profile" action={<OutlineButton icon={Pencil} onClick={()=>setOrgEditor('profile')}>Edit</OutlineButton>} />
            <div className="p-5 pt-4">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-slate-900 text-lg font-semibold text-white">O&amp;P</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold">Oak &amp; Pixel</h2>
                    <span className="rounded bg-success-muted px-2 py-0.5 text-[11px] font-semibold text-success">Verified</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Digital experiences. Purpose-driven brands.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 text-[11px]">
                <Detail label="Organisation Name" value="Oak & Pixel" />
                <Detail label="Website" value="https://oakandpixel.co.za" />
                <Detail label="Industry" value="Digital Agency" />
                <Detail label="Primary Time Zone" value="(UTC+02:00) Johannesburg" />
                <Detail label="Country" value="South Africa" />
                <Detail label="Date Format" value="20 Aug 2026" />
                <Detail label="Currency" value="ZAR (R)" />
                <Detail label="Measurement System" value="Metric (m, kg, °C)" />
              </div>
            </div>
          </Card>

          <Card>
            <PanelHeader title="Organisation Details" action={<OutlineButton icon={Pencil} onClick={()=>setOrgEditor('details')}>Edit</OutlineButton>} />
            <div className="space-y-1.5 p-5 pt-4">
              <IconDetail icon={Building2} label="Registration Number" value="2021/123456/07" />
              <IconDetail icon={Hash} label="VAT Number" value="4830294821" />
              <IconDetail icon={MapPin} label="Address" value="23 Design Street, Rosebank, Johannesburg, 2196, South Africa" />
              <IconDetail icon={Phone} label="Phone" value="+27 11 123 4567" />
              <IconDetail icon={Mail} label="Email" value="hello@oakandpixel.co.za" />
            </div>
          </Card>
        </div>

        <div className="grid min-w-0 gap-4">
          <Card>
            <PanelHeader title="General Preferences" />
            <div className="divide-y divide-border px-5 pb-2 pt-3">
              <Preference icon={Languages} title="Language" description="Choose your preferred language.">
                <SelectMenu options={['English', 'Afrikaans']} value={language} onChange={setLanguage} className="w-24" />
              </Preference>
              <Preference icon={Monitor} title="Theme" description="Select your preferred interface theme.">
                <SelectMenu options={['Light', 'Dark', 'System']} value={theme} onChange={setTheme} className="w-24" />
              </Preference>
              <Preference icon={LayoutList} title="Items per page" description="Number of items to display in tables.">
                <SelectMenu options={['10', '20', '50']} value={items} onChange={setItems} className="w-24" />
              </Preference>
              <Preference icon={Globe2} title="Default Landing Page" description="Choose where TRACE should land after login.">
                <SelectMenu options={['Audits', 'History', 'Templates']} value={landing} onChange={setLanding} className="w-24" />
              </Preference>
              <Preference icon={Save} title="Auto-save" description="Automatically save changes while working.">
                <Toggle checked={autoSave} onChange={setAutoSave} />
              </Preference>
              <Preference icon={ShieldCheck} title="Confirm Before Deleting" description="Show confirmation when deleting items.">
                <Toggle checked={confirmDelete} onChange={setConfirmDelete} />
              </Preference>
              <Preference icon={CircleGauge} title="Compact Mode" description="Reduce spacing for a denser layout.">
                <Toggle checked={compactMode} onChange={setCompactMode} />
              </Preference>
            </div>
          </Card>

          <Card>
            <PanelHeader title="Data & Storage" />
            <div className="space-y-3 p-5 pt-4">
              <ActionRow icon={Database} title="Total Storage Used" description="Across all audits, evidence and exports" value="2.48 GB" />
              <ActionRow icon={Archive} title="Storage Limit" description="Your current plan includes" value="50 GB" />
              <ActionRow icon={Globe2} title="Manage Storage" description="Review and clean up large files and exports" action="Manage" onAction={()=>setOrgEditor('storage')} />
              <ActionRow icon={CalendarDays} title="Data Retention Policy" description="Define how long data and evidence are retained" action="Configure" onAction={()=>setOrgEditor('retention')} />
            </div>
          </Card>
        </div>

        <div className="grid min-w-0 gap-4">
          <Card>
            <PanelHeader title="Plan & Usage" action={<span className="rounded bg-muted px-2.5 py-1 text-[11px] font-medium">Professional Plan</span>} />
            <div className="space-y-2.5 p-4 text-xs">
              <StatRow label="Current Plan" value="Professional" />
              <StatRow label="Next Billing Date" value="20 Sep 2026" />
              <StatRow label="Team Members" value="5 / 15" />
              <StatRow label="Audits This Month" value="12 / 200" />
              <StatRow label="Storage Used" value="2.48 GB / 50 GB" />
              <button className="pt-1 text-xs font-semibold text-brand">Manage subscription &nbsp; →</button>
            </div>
          </Card>

          <Card>
            <PanelHeader title="System Status" />
            <div className="space-y-3 p-4">
              <StatusItem title="All systems operational" detail="No issues detected" />
              <StatusItem title="Last backup" detail="20 Aug 2026, 02:15 AM" />
              <StatusItem title="Services" detail="All services are running" />
            </div>
          </Card>

          <Card>
            <PanelHeader title="Danger Zone" />
            <div className="divide-y divide-border px-5 pb-2 pt-3">
              <DangerRow icon={Archive} title="Archive Organisation" detail="Archive this organisation and all data." action="Archive" onAction={()=>setDanger('archive')} />
              <DangerRow icon={Trash2} title="Delete Organisation" detail="Permanently delete this organisation." action="Delete" onAction={()=>setDanger('delete')} />
            </div>
          </Card>
        </div>
      </div> : <SettingsSection tab={activeTab} />}

      <SystemStatusBar />
      <CrudFormDialog open={Boolean(orgEditor)} onClose={()=>setOrgEditor(null)} onSubmit={()=>setToast(orgEditor==='profile'?'Organisation profile updated.':orgEditor==='details'?'Organisation details updated.':'Organisation setting saved.')} title={orgEditor==='profile'?'Edit Organisation Profile':orgEditor==='details'?'Edit Organisation Details':orgEditor==='storage'?'Manage Storage':'Data Retention Policy'} description="Changes are attributed to Alex Reed and recorded in organisation activity." fields={orgEditor==='profile'?[{name:'name',label:'Organisation name',value:'Oak & Pixel',required:true},{name:'website',label:'Website',value:'https://oakandpixel.co.za',required:true},{name:'industry',label:'Industry',value:'Digital Agency'},{name:'timezone',label:'Primary time zone',value:'(UTC+02:00) Johannesburg'},{name:'country',label:'Country',value:'South Africa'},{name:'description',label:'Description',value:'Digital experiences. Purpose-driven brands.',type:'textarea'}]:orgEditor==='details'?[{name:'registration',label:'Registration number',value:'2021/123456/07'},{name:'vat',label:'VAT number',value:'4830294821'},{name:'phone',label:'Phone',value:'+27 11 123 4567'},{name:'email',label:'Email',value:'hello@oakandpixel.co.za'},{name:'address',label:'Address',value:'23 Design Street, Rosebank, Johannesburg, 2196, South Africa',type:'textarea'}]:orgEditor==='storage'?[{name:'policy',label:'Cleanup policy',value:'Review only',type:'select',options:['Review only','Archive exports older than 12 months','Archive unlinked drafts']},{name:'notes',label:'Notes',value:'No files will be removed without confirmation.',type:'textarea'}]:orgEditor==='retention'?[{name:'auditRetention',label:'Completed audit retention',value:'7 years',type:'select',options:['3 years','5 years','7 years','Indefinite']},{name:'evidenceRetention',label:'Evidence retention',value:'Match audit retention',type:'select',options:['Match audit retention','5 years','7 years','Indefinite']}]:[]}/>
      <ConfirmActionDialog open={Boolean(danger)} onClose={()=>setDanger(null)} onConfirm={()=>{setToast(danger==='archive'?'Organisation archived in this UI simulation.':'Permanent deletion is blocked in the frontend demo. Contact the system owner.');setDanger(null)}} title={danger==='archive'?'Archive Organisation?':'Delete Organisation?'} description={danger==='archive'?'All organisation access will be suspended. Audit history and evidence remain retained and restorable.':'This irreversible action requires backend re-authentication, owner approval and typed organisation confirmation. It is intentionally blocked in the UI-only build.'} confirmLabel={danger==='archive'?'Archive Organisation':'Deletion Blocked'} destructive/>
      {toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>} 
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-0.5 text-muted-foreground">{label}</p><p className="font-medium leading-normal text-foreground">{value}</p></div>
}

function IconDetail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[11px] leading-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-3.5" /></span>
      <div><p className="font-medium">{label}</p><p className="mt-0.5 text-muted-foreground">{value}</p></div>
    </div>
  )
}

function Preference({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[46px] items-center gap-3 py-1.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-3.5" /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-medium">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p></div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-slate-300')}
    >
      <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

function ActionRow({ icon: Icon, title, description, value, action, onAction }: { icon: React.ElementType; title: string; description: string; value?: string; action?: string; onAction?:()=>void }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-3.5" /></span>
      <div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="mt-0.5 truncate text-muted-foreground">{description}</p></div>
      {value && <span className="font-medium">{value}</span>}
      {action && <OutlineButton onClick={onAction}>{action}</OutlineButton>}
    </div>
  )
}

function StatusItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-success text-white"><Check className="size-2.5" strokeWidth={3} /></span>
      <div><p className="font-semibold">{title}</p><p className="mt-1 text-muted-foreground">{detail}</p></div>
    </div>
  )
}

function DangerRow({ icon: Icon, title, detail, action, onAction }: { icon: React.ElementType; title: string; detail: string; action: string; onAction:()=>void }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[11px] leading-3.5">
      <Icon className="size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="mt-1 text-[10px] leading-3.5 text-muted-foreground">{detail}</p></div>
      <button onClick={onAction} className="rounded-md border border-destructive/30 px-3 py-2 font-medium text-destructive"><Trash2 className="mr-1 inline size-3" />{action}</button>
    </div>
  )
}

function OutlineButton({ icon: Icon, children, onClick }: { icon?: React.ElementType; children: React.ReactNode; onClick?:()=>void }) {
  return <button onClick={onClick} className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">{Icon && <Icon className="mr-1.5 inline size-3.5" />}{children}</button>
}

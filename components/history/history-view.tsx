'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { historyRecords } from '@/data/mock/audits'
import { PageHeader } from '@/components/layout/page-header'
import { PageTabs } from '@/components/ui/tabs'
import { Panel, StatRow } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { DonutChart, DonutLegend } from '@/components/charts/audit-type-chart'
import { HistoryTable } from './history-table'
import { ScoreTrend } from './score-trend'
import { ReferenceVariant } from '@/components/ui/reference-variant'
import { HistoryAnalytics } from './history-analytics'
import { TableToolbar } from '@/components/ui/table-toolbar'
import { ConfirmActionDialog, CrudToast } from '@/components/ui/crud'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'

const tabs = ['All History', 'Analytics', 'Assessments', 'Reassessments', 'Baselines', 'Archived']
const typeData = [
  { label: 'Website Audit', value: 8, display: '8 (33%)', color: 'oklch(0.58 0.2 35)' },
  { label: 'Digital Presence Audit', value: 6, display: '6 (25%)', color: 'oklch(0.6 0.13 250)' },
  { label: 'Brand Consistency Audit', value: 4, display: '4 (17%)', color: 'oklch(0.75 0.12 70)' },
  { label: 'Operational Flow Audit', value: 4, display: '4 (17%)', color: 'oklch(0.72 0.16 55)' },
  { label: 'Custom Audit', value: 2, display: '2 (8%)', color: 'oklch(0.62 0 0)' },
]

export function HistoryView() {
  const [tab, setTab] = useState(tabs[0])
  const [query, setQuery] = useState('')
  const [organisation, setOrganisation] = useState('All Organisations')
  const [auditType, setAuditType] = useState('All Audit Types')
  const [period, setPeriod] = useState('Last 12 Months')
  const [sort, setSort] = useState('Recently updated')
  const [archivedIds,setArchivedIds]=useState<string[]>([])
  const [archiveId,setArchiveId]=useState<string|null>(null)
  const [toast,setToast]=useState('')
  const filtered = historyRecords.filter((record) => {
    const searchable = `${record.name} ${record.id} ${record.auditType} ${record.scope}`.toLowerCase()
    const matchesQuery = !query || searchable.includes(query.toLowerCase())
    const matchesOrganisation = organisation === 'All Organisations' || record.scope.includes(organisation)
    const matchesType = auditType === 'All Audit Types' || record.auditType === auditType
    const matchesPeriod = period === 'Last 12 Months' || (period === 'This Year' && record.completed.includes('2026')) || (period === 'Last 6 Months' && !record.completed.includes('Nov 2025'))
    return matchesQuery && matchesOrganisation && matchesType && matchesPeriod && !archivedIds.includes(record.id)
  }).sort((a,b)=>sort === 'Name A–Z' ? a.name.localeCompare(b.name) : sort === 'Priority' ? (b.score ?? -1) - (a.score ?? -1) : sort === 'Status' ? a.assessmentType.localeCompare(b.assessmentType) : 0)

  return (
    <div>
      <PageHeader title="History" description="View and analyse past audits and reassessments across all organisations." />
      <PageTabs tabs={tabs} active={tab} onChange={setTab} className="-mt-2 mb-4" />
      <TableToolbar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search history…" sortValue={sort} onSortChange={setSort} filters={[{label:'Organisation',value:organisation,onChange:setOrganisation,allValue:'All Organisations',options:['All Organisations','Oak & Pixel','HIMARK']},{label:'Audit type',value:auditType,onChange:setAuditType,allValue:'All Audit Types',options:['All Audit Types',...AUDIT_TYPE_NAMES,'Custom Audit']},{label:'Period',value:period,onChange:setPeriod,allValue:'Last 12 Months',options:['Last 12 Months','Last 6 Months','This Year']}]} />
      {tab === 'All History' ? <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_264px]">
        <Panel className="min-w-0 overflow-hidden">
          <HistoryTable records={filtered} onArchive={setArchiveId} onFeedback={setToast}/>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"><p className="text-sm text-muted-foreground">Showing 1 to {filtered.length} of 24 history records</p><Pagination page={1} totalPages={3} onChange={() => {}} /></div>
        </Panel>
        <aside className="space-y-4">
          <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">History Overview</h3><div className="space-y-1.5"><StatRow label="Total Assessments" value="24" /><StatRow label="Baselines" value="9" /><StatRow label="Reassessments" value="15" /><StatRow label="Average Score" tooltip="Mean completed assessment score for the selected period. Records without a numeric score are excluded." value={<span>73<span className="text-muted-foreground">/100</span></span>} /><StatRow label="Improvement Rate" tooltip="Share of reassessments whose score improved compared with their linked baseline." value="60%" valueClassName="text-success" /></div></Panel>
          <Panel className="p-4"><h3 className="mb-3 text-xs font-semibold">Score Trend <span className="font-normal text-muted-foreground">(Average)</span></h3><ScoreTrend /></Panel>
          <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Audit Types</h3><div className="flex items-center gap-3"><DonutChart data={typeData} size={72} thickness={12} /><div className="min-w-0 flex-1"><DonutLegend data={typeData} /></div></div></Panel>
          <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Recent Reassessments</h3><div className="space-y-3 text-xs"><div className="flex justify-between"><span>Oak & Pixel Website — Feb 2026</span><span className="text-success">▲ 8 pts</span></div><div className="flex justify-between"><span>Purchase-to-Pay — Reassessment 01</span><span className="text-success">▲ —</span></div><div className="flex justify-between"><span>Website — Nov 2025</span><span className="text-brand">▼ 6 pts</span></div></div><a href="#" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">View all reassessments <ArrowRight className="size-3.5" /></a></Panel>
        </aside>
      </div> : tab === 'Analytics' ? <HistoryAnalytics/> : <ReferenceVariant domain="history" tab={tab} />}
      <ConfirmActionDialog open={Boolean(archiveId)} onClose={()=>setArchiveId(null)} onConfirm={()=>{if(archiveId)setArchivedIds(current=>[...current,archiveId]);setArchiveId(null);setToast('History record archived. Scores, evidence links and attribution remain intact.')}} title="Archive History Record?" description="The record will leave the active history register, but its evidence, findings, recommendations and attribution will remain unchanged and restorable." confirmLabel="Archive Record" destructive/>
      {toast&&<CrudToast message={toast} onClose={()=>setToast('')}/>} 
    </div>
  )
}

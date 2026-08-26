import { ArrowRight } from 'lucide-react'
import { evidenceItems } from '@/data/mock/evidence'
import { DonutChart, DonutLegend } from '@/components/charts/audit-type-chart'
import { Panel, StatRow } from '@/components/ui/card'
import { RowIcon } from '@/components/ui/row-icon'

const evidenceTypes = [
  { label: 'Screenshot', value: 48, display: '48 (30.8%)', color: 'oklch(0.58 0.2 35)' },
  { label: 'File', value: 33, display: '33 (21.2%)', color: 'oklch(0.6 0.13 250)' },
  { label: 'Report', value: 26, display: '26 (16.7%)', color: 'oklch(0.69 0.13 75)' },
  { label: 'Document', value: 20, display: '20 (12.8%)', color: 'oklch(0.74 0.08 45)' },
  { label: 'Data', value: 15, display: '15 (9.6%)', color: 'oklch(0.55 0.13 155)' },
  { label: 'Other', value: 14, display: '14 (9.0%)', color: 'oklch(0.6 0 0)' },
]

export function EvidenceSummary() {
  return (
    <aside className="space-y-3">
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Evidence Overview</h3><div className="space-y-1.5"><StatRow label="Total Evidence" value="156" /><StatRow label="Validated" value="98" /><StatRow label="Under Review" value="28" /><StatRow label="Needs Review" value="18" /><StatRow label="Archived" value="12" /><StatRow label="Total Size" value="2.48 GB" /></div></Panel>
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Evidence by Type</h3><div className="flex items-center gap-3"><DonutChart data={evidenceTypes} size={72} thickness={12} /><div className="min-w-0 flex-1"><DonutLegend data={evidenceTypes} /></div></div><a href="#" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">View full breakdown <ArrowRight className="size-3.5" /></a></Panel>
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Latest Evidence</h3><div className="space-y-4">{evidenceItems.slice(0, 3).map((item) => <div key={item.id} className="flex items-center gap-3"><RowIcon name={item.icon} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.name}</p><p className="truncate text-[11px] text-muted-foreground">{item.audit}</p></div><div className="text-right text-[10px] text-muted-foreground"><p>{item.uploadedOn.split(', ')[1]}</p><p>20 Aug 2026</p></div></div>)}</div><a href="#" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">View all evidence <ArrowRight className="size-3.5" /></a></Panel>
    </aside>
  )
}

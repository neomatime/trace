import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DonutChart, DonutLegend } from '@/components/charts/audit-type-chart'
import { Panel, StatRow } from '@/components/ui/card'

const frameworkTypes = [
  { label: 'Website Audit', value: 2, display: '2 (25%)', color: 'oklch(0.58 0.2 35)' },
  { label: 'Digital Presence Audit', value: 2, display: '2 (25%)', color: 'oklch(0.6 0.13 250)' },
  { label: 'Brand Consistency Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.75 0.12 70)' },
  { label: 'Operational Flow Audit', value: 3, display: '3 (37.5%)', color: 'oklch(0.66 0.12 300)' },
  { label: 'Custom Audit', value: 0, display: '0 (0%)', color: 'oklch(0.62 0 0)' },
]

export function FrameworkSummaryCards() {
  return (
    <aside className="space-y-3">
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Framework Overview</h3><div className="space-y-1.5"><StatRow label="Total Frameworks" value="8" /><StatRow label="Active" value="5" /><StatRow label="Draft" value="1" /><StatRow label="Inactive" value="2" /><StatRow label="Archived" value="0" /><StatRow label="Total Usage" value="66" /></div></Panel>
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Frameworks by Audit Type</h3><div className="flex items-center gap-3"><DonutChart data={frameworkTypes} size={72} thickness={12} /><div className="min-w-0 flex-1"><DonutLegend data={frameworkTypes} /></div></div></Panel>
      <Panel className="p-4"><h3 className="mb-4 text-xs font-semibold">Most Used Frameworks</h3><div className="space-y-3 text-xs"><div className="flex justify-between"><span>HIMARK Web Audit Framework</span><b>18</b></div><div className="flex justify-between"><span>Operational Flow Framework</span><b>15</b></div><div className="flex justify-between"><span>Digital Presence Framework</span><b>12</b></div><div className="flex justify-between"><span>Brand Consistency Framework</span><b>9</b></div><div className="flex justify-between"><span>Security Posture Framework</span><b>6</b></div></div><a href="#" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">View usage report <ArrowRight className="size-3.5" /></a></Panel>
      <Panel className="p-4"><h3 className="text-xs font-semibold">Create a Framework</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Build a new framework from scratch or import an existing one.</p><Link href="/frameworks/new" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand">Create framework <ArrowRight className="size-3.5" /></Link></Panel>
    </aside>
  )
}

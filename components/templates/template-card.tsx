import { ArrowRight } from 'lucide-react'
import { DonutChart, DonutLegend } from '@/components/charts/audit-type-chart'
import { Panel, StatRow } from '@/components/ui/card'

const donutData = [
  { label: 'Website Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.63 0.2 30)' },
  { label: 'Digital Presence Audit', value: 2, display: '2 (25%)', color: 'oklch(0.6 0.13 250)' },
  { label: 'Brand Consistency Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.72 0.16 65)' },
  { label: 'Operational Flow Audit', value: 3, display: '3 (37.5%)', color: 'oklch(0.55 0.16 300)' },
  { label: 'Custom Audit', value: 1, display: '1 (12.5%)', color: 'oklch(0.7 0 0)' },
]

const popularTemplates = [
  { name: 'Website Audit v1.0', uses: 12 },
  { name: 'Digital Presence Audit v1.0', uses: 7 },
  { name: 'Brand Consistency Audit v1.0', uses: 5 },
  { name: 'Operational Flow Audit v1.0', uses: 4 },
]

export function TemplateOverviewCards() {
  return (
    <div className="flex flex-col gap-3">
      <Panel className="p-4">
        <h3 className="mb-4 text-xs font-semibold">Templates Overview</h3>
        <div className="flex flex-col gap-1.5">
          <StatRow label="Total Templates" value="8" />
          <StatRow label="Active" value="5" />
          <StatRow label="Inactive" value="2" />
          <StatRow label="Drafts" value="1" />
          <StatRow label="Shared With Me" value="3" />
          <StatRow label="Total Usage" value="34" />
        </div>
      </Panel>

      <Panel className="p-4">
        <h3 className="mb-4 text-xs font-semibold">Templates by Audit Type</h3>
        <div className="flex items-center gap-5">
          <DonutChart data={donutData} size={72} thickness={12} />
          <div className="flex-1"><DonutLegend data={donutData} /></div>
        </div>
      </Panel>

      <Panel className="p-4">
        <h3 className="mb-4 text-xs font-semibold">Popular Templates</h3>
        <ul className="flex flex-col gap-2">
          {popularTemplates.map((template) => (
            <li key={template.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{template.name}</span>
              <span className="whitespace-nowrap text-muted-foreground">{template.uses} uses</span>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          View all templates <ArrowRight className="size-3.5" />
        </a>
      </Panel>

      <Panel className="p-4">
        <h3 className="mb-1.5 text-xs font-semibold">Need a Custom Template?</h3>
        <p className="text-xs text-muted-foreground">Build a template based on your organisation&apos;s unique requirements.</p>
        <a href="#" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          Create Custom Template <ArrowRight className="size-3.5" />
        </a>
      </Panel>
    </div>
  )
}

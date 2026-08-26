import { FilterButton, SearchInput, SelectMenu } from '@/components/ui/filter-bar'
import { AUDIT_TYPE_NAMES } from '@/config/audit-types'

export function HistoryFilters({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
      <SearchInput placeholder="Search history…" value={query} onChange={onQueryChange} className="w-full sm:w-48" />
      <SelectMenu options={['All Organisations', 'Oak & Pixel', 'HIMARK']} value="All Organisations" onChange={() => {}} className="w-full sm:w-40" />
      <SelectMenu options={['All Audit Types', ...AUDIT_TYPE_NAMES, 'Custom Audit']} value="All Audit Types" onChange={() => {}} className="w-full sm:w-44" />
      <SelectMenu options={['Last 12 Months', 'Last 6 Months', 'This Year']} value="Last 12 Months" onChange={() => {}} className="w-full sm:w-40" />
      <FilterButton />
    </div>
  )
}

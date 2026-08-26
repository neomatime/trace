'use client'

import type { historyRecords } from '@/data/mock/audits'
import { RowIcon } from '@/components/ui/row-icon'
import { StatusBadge } from '@/components/ui/badge'
import { DataTable, Td, Th, THead, TRow } from '@/components/ui/table'
import { ActionMenu } from '@/components/templates/template-actions'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays } from 'lucide-react'

type HistoryRecord = (typeof historyRecords)[number]

export function HistoryTable({ records, onArchive, onFeedback }: { records: readonly HistoryRecord[]; onArchive:(id:string)=>void; onFeedback:(message:string)=>void }) {
  const router=useRouter()

  const actionsFor = (record: HistoryRecord) => [
    {label:'View Audit',kind:'view' as const,onSelect:()=>router.push(`/audits/${record.id}`)},
    {label:'View Evidence',kind:'view' as const,onSelect:()=>router.push(`/evidence?audit=${record.id}`)},
    {label:'View Findings',kind:'view' as const,onSelect:()=>router.push(`/audits/${record.id}/findings`)},
    {label:'View Recommendations',kind:'view' as const,onSelect:()=>router.push(`/audits/${record.id}/recommendations`)},
    ...(record.assessmentType.startsWith('Reassessment')?[{label:'Compare with Baseline',kind:'duplicate' as const,onSelect:()=>router.push(`/audits/${record.id}/reassessment`)}]:[]),
    {label:'Generate Report',kind:'duplicate' as const,onSelect:()=>onFeedback(`Report prepared for ${record.name}.`)},
    {label:'Export Record',kind:'duplicate' as const,onSelect:()=>onFeedback(`${record.id} export prepared.`)},
    {label:'Archive Record',kind:'archive' as const,onSelect:()=>onArchive(record.id)},
  ]

  return (
    <>
    <div className="hidden md:block">
    <DataTable className="min-w-[1030px] table-fixed text-[11px]">
      <THead>
        <Th className="w-[23%] px-3">Audit / Assessment</Th><Th className="w-[11%] px-3">Audit Type</Th><Th className="w-[13%] px-3">Organisation / Scope</Th><Th className="w-[11%] px-3">Assessment Type</Th><Th className="w-[14%] px-3">Completed</Th><Th className="w-[7%] px-3">Score</Th><Th className="w-[6%] px-3">Change</Th><Th className="w-[9%] px-3">Completed By</Th><Th className="w-8 px-1" />
      </THead>
      <tbody>
        {records.map((record) => (
          <TRow key={record.id} className="h-[54px]">
            <Td className="px-3 py-2"><div className="flex items-center gap-3"><RowIcon name={record.icon} /><div className="min-w-0"><p className="truncate font-semibold">{record.name}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{record.id}</p></div></div></Td>
            <Td className="px-3 py-2 text-muted-foreground">{record.auditType}</Td>
            <Td className="px-3 py-2 text-muted-foreground">{record.scope}</Td>
            <Td className="px-3 py-2"><StatusBadge status={record.assessmentType} /></Td>
            <Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{record.completed}</Td>
            <Td className="px-3 py-2">{record.score === null ? '—' : <><span className="text-base font-semibold text-brand">{record.score}</span><span className="text-muted-foreground"> /100</span></>}</Td>
            <Td className="px-3 py-2">{record.change === null ? '—' : <span className={record.change > 0 ? 'font-semibold text-success' : 'font-semibold text-brand'}>{record.change > 0 ? '▲' : record.change < 0 ? '▼' : '▲'} {Math.abs(record.change) || '—'}</span>}</Td>
            <Td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{record.completedBy}</Td>
            <Td className="px-1 py-2"><ActionMenu actions={actionsFor(record)} /></Td>
          </TRow>
        ))}
      </tbody>
    </DataTable>
    </div>

    <div className="divide-y divide-border md:hidden">
      {records.map((record) => (
        <article key={record.id} className="px-4 py-4 first:pt-3">
          <div className="flex items-start gap-3">
            <RowIcon name={record.icon} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{record.name}</h3>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{record.id}</p>
            </div>
            <ActionMenu actions={actionsFor(record)} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={record.assessmentType} />
            <span className="text-[11px] text-muted-foreground">{record.auditType}</span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-muted/35 p-3 text-[11px]">
            <div>
              <dt className="text-muted-foreground">Score</dt>
              <dd className="mt-0.5 font-semibold">{record.score === null ? 'Not scored' : <><span className="text-base text-brand">{record.score}</span> /100</>}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Change</dt>
              <dd className={`mt-1 font-semibold ${record.change && record.change > 0 ? 'text-success' : record.change && record.change < 0 ? 'text-brand' : ''}`}>{record.change === null ? 'No comparison' : `${record.change > 0 ? '▲' : record.change < 0 ? '▼' : '—'} ${record.change === 0 ? '' : Math.abs(record.change)}`}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="mt-1 truncate font-medium">{record.scope}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">Completed by</dt>
              <dd className="mt-1 truncate font-medium">{record.completedBy}</dd>
            </div>
          </dl>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground"><CalendarDays className="size-3.5 shrink-0" />{record.completed}</span>
            <button onClick={()=>router.push(`/audits/${record.id}`)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={`View ${record.name}`}>
              View audit <ArrowRight className="size-3.5" />
            </button>
          </div>
        </article>
      ))}
    </div>
    </>
  )
}

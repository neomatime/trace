import { CheckCircle2 } from 'lucide-react'
import { AuditHeader } from './audit-header'
import { AuditTabs } from './audit-tabs'
import { ConfigurableAuditOverview } from './configurable-audit-overview'

export function AuditOverviewView(){return <div><AuditHeader/><AuditTabs/><ConfigurableAuditOverview/><div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border pt-5 text-xs"><span className="flex items-center gap-2"><CheckCircle2 className="size-4"/> Audit workspace active</span><span className="h-0.5 min-w-32 flex-1 bg-brand"/><span>Last updated:</span><span>20 Aug 2026, 10:42 AM</span></div></div>}

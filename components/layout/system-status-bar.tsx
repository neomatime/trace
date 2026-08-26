import { CheckCircle2, RefreshCw } from 'lucide-react'

export function SystemStatusBar() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border px-1 pt-5 text-xs text-muted-foreground">
      <span className="flex items-center gap-2 font-medium text-foreground">
        <CheckCircle2 className="size-4" /> System healthy
      </span>
      <span>All systems operational</span>
      <span className="ml-auto">Last updated: &nbsp; 20 Aug 2026, 10:38 AM</span>
      <RefreshCw className="size-4" />
    </div>
  )
}

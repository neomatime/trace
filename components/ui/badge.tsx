import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  Active: 'bg-success-muted text-success',
  Completed: 'bg-success-muted text-success',
  Validated: 'bg-success-muted text-success',
  Verified: 'bg-success-muted text-success',
  Inactive: 'bg-info-muted text-info',
  Draft: 'bg-muted text-muted-foreground',
  Archived: 'bg-muted text-muted-foreground',
  Deprecated: 'bg-muted text-muted-foreground',
  'In Progress': 'bg-info-muted text-info',
  'Under Review': 'bg-warning-muted text-warning',
  'Needs Review': 'bg-brand-muted text-brand',
  Baseline: 'bg-success-muted text-success',
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground', className)}>{children}</span>
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const isReassessment = status.startsWith('Reassessment')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        isReassessment ? 'bg-info-muted text-info' : styles[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {status}
    </span>
  )
}

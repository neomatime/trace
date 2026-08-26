import { cn } from '@/lib/utils'
import { InfoTooltip } from './tooltip'

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('min-w-0 rounded-lg border border-border bg-card', className)}>{children}</div>
}

export function Panel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <Card className={className}>{children}</Card>
}

export function PanelHeader({
  title,
  action,
  className,
}: {
  title: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between px-5 pt-5', className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  )
}

export function StatRow({
  label,
  value,
  valueClassName,
  tooltip,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
  tooltip?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">{label}{tooltip&&<InfoTooltip content={tooltip}/>}</span>
      <span className={cn('font-medium text-foreground', valueClassName)}>{value}</span>
    </div>
  )
}

import { cn } from '@/lib/utils'

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="table-scroll w-full overflow-x-auto overflow-y-hidden">
      <table className={cn('w-full min-w-[880px] border-collapse text-[13px]', className)}>{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border">{children}</tr>
    </thead>
  )
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <th
      className={cn(
        'px-4 py-3.5 text-xs font-semibold text-foreground/75',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-border last:border-0 transition-colors hover:bg-muted/40',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <td
      className={cn(
        'px-4 py-4 align-middle text-foreground',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  )
}

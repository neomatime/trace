import { Inbox } from 'lucide-react'
export { ErrorState, Skeleton } from './data-states'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

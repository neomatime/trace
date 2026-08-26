import { Skeleton } from '@/components/ui/feedback'

export default function Loading() {
  return (
    <div className="space-y-4 p-8" aria-label="Loading">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

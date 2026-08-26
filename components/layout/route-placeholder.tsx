import { PageHeader } from './page-header'
import { EmptyState } from '@/components/ui/feedback'

export function RoutePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState title={`${title} foundation ready`} description="This route is intentionally placeholder-only until its existing or approved domain implementation is available." />
    </div>
  )
}

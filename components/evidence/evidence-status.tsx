import { StatusBadge } from '@/components/ui/badge'

export function EvidenceStatus({ status }: { status: string }) {
  return <StatusBadge status={status} />
}

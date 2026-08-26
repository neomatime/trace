'use client'

import { CrudActionMenu, type CrudAction } from '@/components/ui/crud'

export function ActionMenu({ actions }: { actions?: readonly CrudAction[] }) {
  return <CrudActionMenu actions={actions ?? []} />
}

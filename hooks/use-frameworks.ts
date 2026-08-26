'use client'

import { useMemo } from 'react'
import type { Framework } from '@/types/framework'

export function useFrameworks(frameworks: readonly Framework[] = []) {
  return useMemo(() => ({ frameworks, count: frameworks.length }), [frameworks])
}

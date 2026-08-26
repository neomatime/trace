'use client'

import { useState } from 'react'
import type { Organisation } from '@/types/organisation'

export function useOrganisation(initialOrganisation: Organisation | null = null) {
  const [organisation, setOrganisation] = useState(initialOrganisation)
  return { organisation, setOrganisation }
}

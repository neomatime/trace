'use client'

import { useState } from 'react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { organisations } from '@/data/mock/users'

export function OrganisationSwitcher() {
  const [open, setOpen] = useState(false)
  const [activeOrganisation, setActiveOrganisation] = useState(organisations[0])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((visible) => !visible)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
      >
        <span className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <Building2 className="size-4" strokeWidth={1.75} />
        </span>
        <span className="flex-1 truncate text-sm font-medium">{activeOrganisation.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div role="listbox" className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {organisations.map((organisation) => (
            <button
              key={organisation.id}
              role="option"
              aria-selected={organisation.id === activeOrganisation.id}
              onClick={() => {
                setActiveOrganisation(organisation)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
                {organisation.initials}
              </span>
              <span className="flex-1 truncate">{organisation.name}</span>
              {organisation.id === activeOrganisation.id && <Check className="size-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

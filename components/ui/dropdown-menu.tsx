'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DropdownMenuItem {
  label: string
  onSelect: () => void
  destructive?: boolean
}

export function DropdownMenu({ label, items, className }: { label: React.ReactNode; items: readonly DropdownMenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeWhenOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeWhenOutside)
    return () => document.removeEventListener('mousedown', closeWhenOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((visible) => !visible)} className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted/50">
        {label}<ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {items.map((item) => (
            <button key={item.label} role="menuitem" type="button" onClick={() => { item.onSelect(); setOpen(false) }} className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-muted', item.destructive && 'text-destructive')}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

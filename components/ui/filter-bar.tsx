'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, SlidersHorizontal, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from './tooltip'

export function SearchInput({
  placeholder = 'Search…',
  value,
  onChange,
  className,
}: {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <Search className="pointer-events-none absolute right-3 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function SelectMenu({
  options,
  value,
  onChange,
  className,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground hover:bg-muted/50"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-full min-w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="truncate">{opt}</span>
              {opt === value && <Check className="size-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterButton({ onClick }: { onClick?: () => void }) {
  return (
    <Tooltip content="More filters"><button
      onClick={onClick}
      aria-label="More filters"
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted/50"
    >
      <SlidersHorizontal className="size-4" />
    </button></Tooltip>
  )
}

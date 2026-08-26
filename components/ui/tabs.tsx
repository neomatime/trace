'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
    })
    return () => window.cancelAnimationFrame(frame)
  }, [active])
  const scroll = (direction: -1 | 1) => listRef.current?.scrollBy({left:direction * Math.min(260, listRef.current.clientWidth * 0.72),behavior:'smooth'})
  return (
    <div className={cn('relative max-w-full', className)}>
      <button type="button" onClick={()=>scroll(-1)} aria-label="Show previous tabs" className="absolute bottom-px left-0 z-10 flex h-10 w-8 items-center justify-start bg-gradient-to-r from-background via-background to-transparent text-muted-foreground sm:hidden"><ChevronLeft className="size-4"/></button>
      <div ref={listRef} role="tablist" aria-label="Page sections" className="flex max-w-full items-center gap-5 overflow-x-auto border-b border-border px-8 sm:gap-6 sm:px-0">
        {tabs.map((tab) => {
          const isActive = tab === active
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              key={tab}
              onClick={() => onChange(tab)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                isActive
                  ? 'border-brand font-semibold text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>
      <button type="button" onClick={()=>scroll(1)} aria-label="Show more tabs" className="absolute bottom-px right-0 z-10 flex h-10 w-8 items-center justify-end bg-gradient-to-l from-background via-background to-transparent text-muted-foreground sm:hidden"><ChevronRight className="size-4"/></button>
    </div>
  )
}

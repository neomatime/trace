'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  const pages: (number | '…')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1, 2, 3, '…', totalPages)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={i} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onChange(p)}
            className={cn(
              'flex size-8 items-center justify-center rounded-md border text-sm',
              p === page
                ? 'border-border bg-muted font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

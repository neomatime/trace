'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function Dialog({ open, onClose, title, description, children, className, contentClassName }: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    window.requestAnimationFrame(() => focusable()[0]?.focus())
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if(event.key==='Tab'){
        const items=focusable();if(!items.length)return
        const first=items[0];const last=items[items.length-1]
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {document.removeEventListener('keydown', closeOnEscape);document.body.style.overflow=previousOverflow;previousFocus?.focus()}
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn('w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95', className)} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className={cn('mt-5', contentClassName)}>{children}</div>
      </section>
    </div>,
    document.body,
  )
}

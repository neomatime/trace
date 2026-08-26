'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive, CheckCircle2, Copy, Eye, MoreVertical, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import { Dialog } from './dialog'
import { cn } from '@/lib/utils'
import { Tooltip } from './tooltip'

export type CrudAction = {
  label: string
  onSelect: () => void
  kind?: 'view' | 'edit' | 'duplicate' | 'archive' | 'restore' | 'delete'
  destructive?: boolean
  disabled?: boolean
}

const actionIcons = { view: Eye, edit: Pencil, duplicate: Copy, archive: Archive, restore: RotateCcw, delete: Trash2 }

export function CrudActionMenu({ actions, label = 'Record actions' }: { actions: readonly CrudAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'down' as 'up' | 'down' })
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menuWidth = 192
    const menuHeight = menuRef.current?.offsetHeight ?? Math.max(48, actions.length * 40 + 8)
    const spaceBelow = window.innerHeight - rect.bottom
    const tableBottom = trigger.closest('table')?.getBoundingClientRect().bottom
    const nearTableBottom = tableBottom !== undefined && tableBottom - rect.bottom < menuHeight + 12
    const placement = (nearTableBottom || spaceBelow < menuHeight + 12) && rect.top > menuHeight + 12 ? 'up' : 'down'
    const preferredTop = placement === 'up' ? rect.top - menuHeight - 8 : rect.bottom + 8
    setPosition({
      top: Math.max(8, Math.min(preferredTop, window.innerHeight - menuHeight - 8)),
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
      placement,
    })
  }, [actions.length])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [])
  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const reposition = () => updatePosition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => { window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true) }
  }, [open, updatePosition])
  return <div ref={ref} className="relative flex justify-center">
    <Tooltip content={label}><span className="inline-flex"><button ref={triggerRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => { if (!open) updatePosition(); setOpen(value => !value) }} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><MoreVertical className="size-4" /></button></span></Tooltip>
    {open && createPortal(<div ref={menuRef} role="menu" data-placement={position.placement} style={{ top: position.top, left: position.left }} className="fixed z-[100] w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
      {actions.map(action => { const Icon = action.kind ? actionIcons[action.kind] : undefined; return <button key={action.label} role="menuitem" type="button" disabled={action.disabled} onClick={() => { action.onSelect(); setOpen(false) }} className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45', (action.destructive || action.kind === 'delete') && 'text-destructive')}>
        {Icon && <Icon className="size-4" strokeWidth={1.75} />}{action.label}
      </button> })}
    </div>, document.body)}
  </div>
}

export function ConfirmActionDialog({ open, onClose, onConfirm, title, description, confirmLabel, destructive = false, busy = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel: string; destructive?: boolean; busy?: boolean }) {
  return <Dialog open={open} onClose={onClose} title={title} description={description}>
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onClose} disabled={busy} className="h-9 rounded-md border border-border px-4 text-xs font-semibold hover:bg-muted disabled:opacity-50">Cancel</button>
      <button type="button" onClick={onConfirm} disabled={busy} className={cn('h-9 rounded-md px-4 text-xs font-semibold text-white disabled:opacity-50', destructive ? 'bg-destructive' : 'bg-primary')}>{busy ? 'Working…' : confirmLabel}</button>
    </div>
  </Dialog>
}

export type CrudField = { name: string; label: string; value: string; type?: 'text' | 'textarea' | 'select' | 'date'; options?: readonly string[]; required?: boolean }

export function CrudFormDialog({ open, onClose, title, description, fields, submitLabel = 'Save changes', onSubmit }: { open: boolean; onClose: () => void; title: string; description?: string; fields: readonly CrudField[]; submitLabel?: string; onSubmit: (values: Record<string,string>) => void }) {
  if (!open) return null
  return <CrudFormDialogContent onClose={onClose} title={title} description={description} fields={fields} submitLabel={submitLabel} onSubmit={onSubmit}/>
}

function CrudFormDialogContent({ onClose, title, description, fields, submitLabel, onSubmit }: { onClose: () => void; title: string; description?: string; fields: readonly CrudField[]; submitLabel: string; onSubmit: (values: Record<string,string>) => void }) {
  const [values, setValues] = useState<Record<string,string>>(() => Object.fromEntries(fields.map(field => [field.name, field.value])))
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [busy, setBusy] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const close = () => {
    const dirty = fields.some(field => values[field.name] !== field.value)
    if (dirty) setDiscardOpen(true)
    else onClose()
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = Object.fromEntries(fields.filter(field => field.required && !values[field.name]?.trim()).map(field => [field.name, `${field.label} is required.`]))
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    window.setTimeout(() => { onSubmit(values); setBusy(false); onClose() }, 450)
  }
  return <><Dialog open onClose={close} title={title} description={description} className="max-w-xl">
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.name} className={cn('text-xs font-semibold', field.type === 'textarea' && 'sm:col-span-2')}>{field.label}{field.required && <span className="text-brand"> *</span>}
        {field.type === 'textarea' ? <textarea rows={4} value={values[field.name] ?? ''} onChange={event => setValues(current => ({...current, [field.name]: event.target.value}))} className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs font-normal outline-none focus:border-brand" /> : field.type === 'select' ? <select value={values[field.name] ?? ''} onChange={event => setValues(current => ({...current, [field.name]: event.target.value}))} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-xs font-normal outline-none focus:border-brand">{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input type={field.type === 'date' ? 'date' : 'text'} value={values[field.name] ?? ''} onChange={event => setValues(current => ({...current, [field.name]: event.target.value}))} className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-xs font-normal outline-none focus:border-brand" />}
        {errors[field.name] && <span className="mt-1 block text-[10px] font-normal text-destructive">{errors[field.name]}</span>}
      </label>)}</div>
      <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={close} className="h-9 rounded-md border border-border px-4 text-xs font-semibold hover:bg-muted">Cancel</button><button type="submit" disabled={busy} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Saving…' : submitLabel}</button></div>
    </form>
  </Dialog><ConfirmActionDialog open={discardOpen} onClose={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); onClose() }} title="Discard unsaved changes?" description="Changes in this form have not been saved." confirmLabel="Discard changes" destructive /></>
}

export function CrudToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3500); return () => window.clearTimeout(timer) }, [onClose])
  return <div role="status" className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-lg border border-success/25 bg-background px-4 py-3 text-xs font-semibold shadow-xl"><CheckCircle2 className="size-4 shrink-0 text-success"/><span>{message}</span><button type="button" aria-label="Dismiss notification" onClick={onClose}><X className="size-3.5 text-muted-foreground"/></button></div>
}

export function CrudEmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-brand-muted"><Archive className="size-5 text-brand"/></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p><button type="button" onClick={onAction} className="mt-4 h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground">{actionLabel}</button></div>
}

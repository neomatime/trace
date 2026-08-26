'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { TraceLogo } from '@/components/layout/trace-logo'
import { PUBLIC_NAV } from '@/config/public-site'
import { cn } from '@/lib/utils'

export function PublicHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="TRACE home" className="shrink-0"><TraceLogo width={118} height={27} /></Link>
        <nav aria-label="Main navigation" className="hidden items-stretch self-stretch md:flex">
          {PUBLIC_NAV.map((item) => {
            const active = pathname === item.href
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex items-center px-4 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground', active && 'text-brand after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand')}>{item.label}</Link>
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted">Sign in</Link>
          <Link href="/sign-up" className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85">Get Started</Link>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="public-mobile-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} className="inline-flex size-10 items-center justify-center rounded-lg border border-border md:hidden">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {open && <div id="public-mobile-nav" className="border-t border-border bg-white px-5 py-5 md:hidden"><nav aria-label="Mobile navigation" className="mx-auto flex max-w-2xl flex-col gap-1">{PUBLIC_NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('rounded-lg px-3 py-3 text-sm font-medium', pathname === item.href ? 'bg-brand-muted text-brand' : 'hover:bg-muted')}>{item.label}</Link>)}<div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-4"><Link href="/sign-in" onClick={() => setOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold">Sign in</Link><Link href="/sign-up" onClick={() => setOpen(false)} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">Get Started</Link></div></nav></div>}
    </header>
  )
}

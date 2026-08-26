import Link from 'next/link'
import { Mail } from 'lucide-react'
import { TraceLogo } from '@/components/layout/trace-logo'
import { FOOTER_GROUPS } from '@/config/public-site'

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.35fr_2fr_auto] lg:px-10">
        <div><TraceLogo width={132} height={30} /><p className="mt-4 text-sm text-muted-foreground">Diagnose. Improve. Measure. Repeat.</p><p className="mt-5 text-xs text-muted-foreground">© 2026 TRACE. All rights reserved.</p></div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{FOOTER_GROUPS.map((group) => <div key={group.title}><h2 className="text-xs font-bold uppercase tracking-[.12em]">{group.title}</h2><ul className="mt-4 space-y-2.5">{group.links.map((item) => <li key={item.label}><Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-brand">{item.label}</Link></li>)}</ul></div>)}</div>
        <div className="flex gap-3 lg:justify-end"><a href="https://www.linkedin.com" aria-label="TRACE on LinkedIn" className="inline-flex size-11 items-center justify-center rounded-full border border-border text-xs font-bold hover:bg-muted">in</a><a href="mailto:hello@trace.co.za" aria-label="Email TRACE" className="inline-flex size-11 items-center justify-center rounded-full border border-border hover:bg-muted"><Mail className="size-4" /></a></div>
      </div>
    </footer>
  )
}

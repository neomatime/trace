'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Layers,
  Clock,
  LayoutTemplate,
  Settings2,
  FileBox,
  Database,
  ChevronsUpDown,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TraceLogo } from './trace-logo'
import { currentUser } from '@/data/mock/users'
import { DASHBOARD_NAVIGATION } from '@/config/navigation'
import { OrganisationSwitcher } from './organisation-switcher'
import { ConfirmActionDialog } from '@/components/ui/crud'
import { Tooltip } from '@/components/ui/tooltip'

const navigationIcons = {
  layers: Layers,
  clock: Clock,
  template: LayoutTemplate,
  framework: Settings2,
  evidence: FileBox,
  settings: Database,
}

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const signOut = () => {
    setSignOutOpen(false)
    setUserMenuOpen(false)
    router.push('/sign-in')
  }
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-in-out lg:flex',
        collapsed ? 'w-[72px]' : 'w-[228px]',
      )}
    >
      <div className={cn('relative flex h-16 items-center overflow-hidden', collapsed ? 'justify-center px-3' : 'px-6')}>
        <Link href="/audits" aria-label="TRACE home">
          <span className={cn('relative block h-8 overflow-hidden transition-[width] duration-300', collapsed ? 'w-8' : 'w-[180px]')}>
            {collapsed ? (
              <Image
                src="/branding/trace-icon.png"
                alt="TRACE"
                width={29}
                height={22}
                priority
                className="absolute left-[2px] top-[5px] max-w-none object-contain"
              />
            ) : (
              <TraceLogo width={150} height={50} className="absolute left-0 top-[-8.6px] max-w-none" />
            )}
          </span>
        </Link>
      </div>

      <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute right-2 top-[52px] z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
      </button></Tooltip>

      <nav className={cn('flex-1 py-4', collapsed ? 'px-2' : 'px-3')}>
        <ul className="flex flex-col gap-1">
          {DASHBOARD_NAVIGATION.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = navigationIcons[item.icon]
            return (
              <li key={item.href} className="relative">
                {active && (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-brand" />
                )}
                <SidebarTooltip enabled={collapsed} content={item.label}><Link
                  href={item.href}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    'flex h-10 items-center rounded-lg text-sm transition-colors',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                    active
                      ? 'bg-sidebar-accent font-medium text-brand'
                      : 'text-foreground hover:bg-sidebar-accent',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2 : 1.75} />
                  {!collapsed && <span>{item.label}</span>}
                </Link></SidebarTooltip>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={cn('relative border-t border-border', collapsed ? 'p-2' : 'p-3')}>
        {collapsed ? (
          <SidebarTooltip enabled content="Oak & Pixel organisation"><button
            type="button"
            aria-label="Oak & Pixel organisation"
            className="flex h-10 w-full items-center justify-center rounded-lg hover:bg-sidebar-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
              <Building2 className="size-4" strokeWidth={1.75} />
            </span>
          </button></SidebarTooltip>
        ) : (
          <OrganisationSwitcher />
        )}

        <div ref={userMenuRef} className="relative">
          <SidebarTooltip enabled={collapsed} content={`${currentUser.name} account menu`}><button
            type="button"
            onClick={() => setUserMenuOpen(open => !open)}
            aria-label={`${currentUser.name} account menu`}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className={cn(
              'mt-1 flex h-10 w-full items-center rounded-lg hover:bg-sidebar-accent',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-2 text-left',
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {currentUser.initials}
            </span>
            {!collapsed && (
              <span className="flex-1 overflow-hidden">
                <span className="block truncate text-sm font-medium">{currentUser.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{currentUser.email}</span>
              </span>
            )}
            {!collapsed && <ChevronsUpDown className="size-4 text-muted-foreground" />}
          </button></SidebarTooltip>

          {userMenuOpen && <div role="menu" className={cn('absolute bottom-12 z-50 w-52 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl', collapsed ? 'left-11' : 'left-0')}>
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-xs font-semibold">{currentUser.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{currentUser.email}</p>
            </div>
            <Link href="/settings/profile" role="menuitem" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted"><UserRound className="size-4" /> My Profile</Link>
            <Link href="/settings/security" role="menuitem" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted"><ShieldCheck className="size-4" /> Security</Link>
            <div className="my-1 border-t border-border" />
            <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); setSignOutOpen(true) }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-muted"><LogOut className="size-4" /> Sign Out</button>
          </div>}
        </div>
      </div>
      <ConfirmActionDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} onConfirm={signOut} title="Sign Out?" description="You will return to the TRACE sign-in page. Any unsaved changes on the current page will be lost." confirmLabel="Sign Out" destructive />
    </aside>
  )
}

function SidebarTooltip({enabled,content,children}:{enabled:boolean;content:string;children:React.ReactElement}) {
  return enabled?<Tooltip content={content}>{children}</Tooltip>:children
}

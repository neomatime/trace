'use client'

import { useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { TopNavigation } from './top-navigation'
import { ContentTransition } from './content-transition'
import { cn } from '@/lib/utils'
import { RouteBreadcrumbs } from './route-breadcrumbs'

export function DashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div
        className={cn(
          'transition-[padding] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[228px]',
        )}
      >
        <TopNavigation />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
          <RouteBreadcrumbs />
          <ContentTransition>{children}</ContentTransition>
        </main>
      </div>
    </div>
  )
}

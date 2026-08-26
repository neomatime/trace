export interface NavigationItem {
  label: string
  href: string
  icon: 'layers' | 'clock' | 'template' | 'framework' | 'evidence' | 'settings'
}

export const DASHBOARD_NAVIGATION: readonly NavigationItem[] = [
  { label: 'Audits', href: '/audits', icon: 'layers' },
  { label: 'History', href: '/history', icon: 'clock' },
  { label: 'Templates', href: '/templates', icon: 'template' },
  { label: 'Frameworks', href: '/frameworks', icon: 'framework' },
  { label: 'Evidence', href: '/evidence', icon: 'evidence' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

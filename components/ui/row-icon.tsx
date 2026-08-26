import {
  Monitor,
  Globe,
  Shield,
  ShieldCheck,
  Workflow,
  FileText,
  Users,
  ClipboardList,
  Box,
  Sheet,
  Video,
  ImageIcon,
  FileCode,
  Link2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  monitor: Monitor,
  globe: Globe,
  shield: Shield,
  'shield-check': ShieldCheck,
  workflow: Workflow,
  file: FileText,
  users: Users,
  clipboard: ClipboardList,
  box: Box,
  sheet: Sheet,
  video: Video,
  image: ImageIcon,
  'file-code': FileCode,
  link: Link2,
}

const tintMap: Record<string, string> = {
  monitor: 'bg-brand-muted text-brand',
  globe: 'bg-info-muted text-info',
  shield: 'bg-brand-muted text-brand',
  'shield-check': 'bg-success-muted text-success',
  workflow: 'bg-info-muted text-info',
  file: 'bg-muted text-muted-foreground',
  users: 'bg-muted text-muted-foreground',
  clipboard: 'bg-muted text-muted-foreground',
  box: 'bg-muted text-muted-foreground',
  sheet: 'bg-success-muted text-success',
  video: 'bg-brand-muted text-brand',
  image: 'bg-warning-muted text-warning',
  'file-code': 'bg-info-muted text-info',
  link: 'bg-brand-muted text-brand',
}

export function RowIcon({
  name,
  className,
  size = 'md',
}: {
  name: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const Icon = iconMap[name] ?? FileText
  const tint = tintMap[name] ?? 'bg-muted text-muted-foreground'
  const dims = size === 'sm' ? 'size-7' : 'size-9'
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-[18px]'
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        dims,
        tint,
        className,
      )}
    >
      <Icon className={iconSize} strokeWidth={1.75} />
    </span>
  )
}

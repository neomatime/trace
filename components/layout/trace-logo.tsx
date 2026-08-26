import Image from 'next/image'
import { cn } from '@/lib/utils'

export function TraceLogo({
  className,
  variant = 'dark',
  width = 108,
  height = 24,
}: {
  className?: string
  variant?: 'dark' | 'light'
  width?: number
  height?: number
}) {
  return (
    <Image
      src="/branding/trace-wordmark.png"
      alt="TRACE"
      width={width}
      height={height}
      priority
      className={cn(
        'h-auto w-auto object-contain',
        variant === 'light' && 'brightness-0 invert',
        className,
      )}
      style={{ width, height }}
    />
  )
}

import { HelpCircle } from 'lucide-react'
import { TraceLogo } from '@/components/layout/trace-logo'
import { SignInForm } from './sign-in-form'

export function AuthPanel() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-black px-[85px] py-12 lg:flex" style={{ backgroundImage: 'url(/branding/sign-in-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div />
        <div className="absolute left-[85px] top-[260px] max-w-[500px]">
          <div className="h-[47px] overflow-hidden"><TraceLogo variant="light" width={432} height={144} className="-ml-[12.9px] -translate-y-[47.5px] max-w-none" /></div>
          <p className="mb-10 mt-5 text-sm font-medium tracking-[0.25em] text-brand">DIAGNOSE. IMPROVE. MEASURE. REPEAT.</p>
          <span className="block h-0.5 w-[60px] bg-brand" />
          <p className="mt-4 max-w-[430px] text-lg leading-relaxed text-white/85">
            TRACE helps organisations uncover what matters, fix what doesn&apos;t, and continuously elevate performance across every touchpoint.
          </p>
        </div>
        <p className="text-xs text-white/60">© 2026 TRACE. All rights reserved.</p>
      </div>

      <div className="relative flex w-full flex-col bg-background px-6 py-8 lg:w-1/2">
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <HelpCircle className="size-4" strokeWidth={1.75} />
            Need help?
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center lg:-translate-x-[27px]"><SignInForm /></div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { MicrosoftLogo } from './microsoft-sign-in'

export function SignInForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    router.push('/overview')
  }

  return (
    <div className="w-full max-w-[494px]">
      <div className="min-h-[675px] rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your TRACE account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input id="email" type="email" required placeholder="you@yourcompany.co.za" className="h-[52px] w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input id="password" type={showPassword ? 'text' : 'password'} required placeholder="Enter your password" className="h-[52px] w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <a href="/forgot-password" className="text-sm font-medium text-brand hover:underline">Forgot password?</a>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 rounded border-border accent-[oklch(0.16_0_0)]" />
            Remember me
          </label>

          <button type="submit" className="h-[50px] w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Sign in</button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button type="button" onClick={() => router.push('/overview')} className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted/50">
            <MicrosoftLogo />
            Sign in with Microsoft
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="#" className="font-medium text-brand hover:underline">Contact your administrator</a>
          </p>
        </form>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        By signing in, you agree to TRACE&apos;s{' '}
        <a href="#" className="font-medium text-brand hover:underline">Terms of Use</a>{' '}
        and{' '}
        <a href="#" className="font-medium text-brand hover:underline">Privacy Policy</a>.
      </p>
    </div>
  )
}

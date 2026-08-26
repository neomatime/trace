import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Password recovery will be connected when TRACE authentication is configured.</p>
        <Link href="/sign-in" className="mt-6 inline-flex text-sm font-medium text-brand hover:underline">Return to sign in</Link>
      </div>
    </main>
  )
}

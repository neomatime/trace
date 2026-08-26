import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The TRACE page you requested does not exist.</p>
      <Link href="/audits" className="mt-6 text-sm font-medium text-brand hover:underline">Return to audits</Link>
    </main>
  )
}

'use client'

import { ErrorState } from '@/components/ui/feedback'
import { Button } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <div className="w-full">
        <ErrorState title="TRACE could not load this view" description="The issue has been contained. Try loading the view again." />
        <Button className="mt-4" onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}

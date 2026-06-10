'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Dashboard error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight">This page hit a snag</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this view. Try again — your data is safe.
        </p>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ShareTokenError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('share/[token] segment error', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto" aria-hidden />
          <div>
            <h2 className="font-display text-lg font-semibold mb-1">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Try refreshing the page.</p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

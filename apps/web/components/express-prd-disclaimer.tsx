'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/src/i18n'
import { cn } from '@/lib/utils'

export function ExpressPrdDisclaimer({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <Alert
      className={cn('border-amber-500/35 bg-amber-500/5', className)}
      role="note"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <AlertDescription className="text-sm">{t('prd.expressDisclaimer')}</AlertDescription>
    </Alert>
  )
}

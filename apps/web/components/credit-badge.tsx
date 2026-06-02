'use client'

import { useCallback, useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CREDITS_UPDATED_EVENT } from '@/lib/credits-events'
import { useI18n } from '@/src/i18n'

export function CreditBadge() {
  const { t } = useI18n()
  const [balance, setBalance] = useState<number | null>(null)
  const router = useRouter()

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/credits', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setBalance(data?.creditBalance ?? 0)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    void fetchBalance()
    const onCreditsUpdated = () => {
      void fetchBalance()
    }
    window.addEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated)
    const interval = setInterval(fetchBalance, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener(CREDITS_UPDATED_EVENT, onCreditsUpdated)
    }
  }, [fetchBalance])

  return (
    <button
      onClick={() => router.push('/dashboard/credits')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors text-sm font-medium"
    >
      <Coins className="h-4 w-4 text-amber-500" />
      <span className="font-mono">{balance !== null ? balance : '...'}</span>
      <span className="text-muted-foreground text-xs">{t('credits.label')}</span>
    </button>
  )
}

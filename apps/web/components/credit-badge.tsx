'use client'

import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export function CreditBadge() {
  const [balance, setBalance] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/credits')
        if (res?.ok) {
          const data = await res.json()
          setBalance(data?.creditBalance ?? 0)
        }
      } catch {
        // Silently fail
      }
    }
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => router.push('/dashboard/credits')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors text-sm font-medium"
    >
      <Coins className="h-4 w-4 text-amber-500" />
      <span className="font-mono">{balance !== null ? balance : '...'}</span>
      <span className="text-muted-foreground text-xs">credits</span>
    </button>
  )
}

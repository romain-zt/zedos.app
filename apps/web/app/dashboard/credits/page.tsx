'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Coins, Zap, CreditCard, ArrowUpRight, ArrowDownRight, Gift, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { FadeIn } from '@/components/ui/animate'
import type { CreditTransactionDTO } from '@repo/contracts/credits/credits-contracts'
import type { AutoReloadPreferenceDTO } from '@repo/contracts/payments'
import { CREDITS_UPDATED_EVENT } from '@/lib/credits-events'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/src/i18n'

interface CreditPack {
  id: string
  size: number
  priceEur: number
  label: string
  description: string
}

type CreditTransactionClient = Omit<CreditTransactionDTO, 'createdAt'> & {
  createdAt?: string
  balanceAfter?: number
}

export default function CreditsPage() {
  const { tp } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [balance, setBalance] = useState<number | null>(null)
  const [graceUsed, setGraceUsed] = useState(false)
  const [transactions, setTransactions] = useState<CreditTransactionClient[]>([])
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [costs, setCosts] = useState<Record<string, number>>({})
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoReload, setAutoReload] = useState<AutoReloadPreferenceDTO | null>(null)
  const [autoReloadSaving, setAutoReloadSaving] = useState(false)
  const [autoReloadMessage, setAutoReloadMessage] = useState<string | null>(null)
  const [taxDisclaimer, setTaxDisclaimer] = useState<string | null>(null)

  const copy = useMemo(() => ({
    pageTitle: tp('pageTitle', 'Credits'),
    pageIntro: tp('pageIntro', 'Credits power AI operations. Each operation has a defined cost.'),
    paymentCancelled: tp('paymentCancelled', 'Payment canceled'),
    creditsAdded: tp('creditsAdded', 'credits added.'),
    stripeReceipt: tp('stripeReceipt', 'Stripe receipt for tax details.'),
    verifyFailed: tp('verifyFailed', 'Payment verification failed'),
    packsLoadFailed: tp('packsLoadFailed', 'Could not load credit packs'),
    creditsLoadFailed: tp('creditsLoadFailed', 'Could not load credits'),
    checkoutStartFailed: tp('checkoutStartFailed', 'Failed to start checkout'),
    checkoutUnavailable: tp(
      'checkoutUnavailable',
      'Payment unavailable: Stripe is not configured (STRIPE_SECRET_KEY).'
    ),
    autoReloadDefaultError: tp(
      'autoReloadDefaultError',
      'Complete a manual credit purchase first to save a payment method.'
    ),
    autoReloadEnabled: tp(
      'autoReloadEnabled',
      'Auto-reload enabled - prepaid convenience only, not a subscription.'
    ),
    autoReloadDisabled: tp('autoReloadDisabled', 'Auto-reload disabled.'),
    autoReloadUpdateFailed: tp('autoReloadUpdateFailed', 'Could not update auto-reload settings.'),
    currentBalance: tp('currentBalance', 'Current balance'),
    negativeBalance: tp('negativeBalance', 'Negative balance - add credits to continue'),
    graceUsed: tp('graceUsed', 'Grace period used. Credits required for all operations.'),
    autoReloadTitle: tp('autoReloadTitle', 'Auto-reload (optional)'),
    autoReloadDescription: tp(
      'autoReloadDescription',
      'Prepaid convenience - buys one credit pack with your saved card when balance is too low. Not a subscription. You can opt out anytime.'
    ),
    autoReloadToggle: tp('autoReloadToggle', 'Enable auto-reload'),
    savePaymentHint: tp(
      'savePaymentHint',
      'Complete at least one successful manual checkout to save a payment method before opting in.'
    ),
    addCreditsTitle: tp('addCreditsTitle', 'Add Credits'),
    loadingPacks: tp('loadingPacks', 'Loading packs...'),
    noPack: tp('noPack', 'No packs available. Try again in a moment.'),
    popular: tp('popular', 'Popular'),
    forCredits: tp('forCredits', 'for'),
    credits: tp('credits', 'credits'),
    digitalCreditsInfo: tp('digitalCreditsInfo', 'Digital AI credits - tax/VAT at checkout when applicable'),
    buyCredits: tp('buyCredits', 'Buy'),
    creditCostsTitle: tp('creditCostsTitle', 'Credit Costs per Operation'),
    costClarification: tp('costClarification', 'Lightweight clarification'),
    costDecision: tp('costDecision', 'Standard decision'),
    costMiniForm: tp('costMiniForm', 'Dynamic mini-form decision'),
    costPrdGen: tp('costPrdGen', 'PRD generation / major update'),
    costPrdChallenge: tp('costPrdChallenge', 'PRD challenge / convergence'),
    transactionsTitle: tp('transactionsTitle', 'Transaction History'),
    noTransactions: tp('noTransactions', 'No transactions yet'),
    usage: tp('usage', 'usage'),
    balanceShort: tp('balanceShort', 'bal'),
  }), [tp])

  const refreshCredits = useCallback(async (): Promise<void> => {
    const credRes = await fetch('/api/credits', { cache: 'no-store' })
    if (!credRes.ok) return

    const data = await credRes.json()
    setBalance(data?.creditBalance ?? 0)
    setGraceUsed(data?.graceUsed ?? false)
    setTransactions(data?.recentTransactions ?? [])
    window.dispatchEvent(new Event(CREDITS_UPDATED_EVENT))
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPage = async () => {
      setLoading(true)
      const success = searchParams?.get('success')
      const sessionId = searchParams?.get('session_id')
      const canceled = searchParams?.get('canceled') === 'true'

      try {
        if (canceled) {
          toast.error(copy.paymentCancelled)
          router.replace('/dashboard/credits')
        }

        if (success === 'true' && sessionId) {
          const verifyRes = await fetch('/api/stripe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
            cache: 'no-store',
          })

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json()
            if (!verifyData?.alreadyProcessed) {
              const tax = verifyData?.taxLegibility
              const taxLine =
                tax?.taxCents != null && tax.taxCents > 0
                  ? ` TVA/taxe : €${(tax.taxCents / 100).toFixed(2)} (total €${((tax.totalCents ?? 0) / 100).toFixed(2)}).`
                  : ''
              toast.success(
                `${verifyData?.creditsAdded ?? 0} ${copy.creditsAdded}${taxLine} ${copy.stripeReceipt}`
              )
            }
          } else {
            const errBody = await verifyRes.json().catch(() => ({}))
            toast.error(
              typeof errBody?.error === 'string' ? errBody.error : copy.verifyFailed
            )
          }

          router.replace('/dashboard/credits')
        }

        const packRes = await fetch('/api/credits/packs', { cache: 'no-store' })
        if (!cancelled) {
          if (packRes.ok) {
            const packData = await packRes.json()
            setPacks(packData?.packs ?? [])
            setCosts(packData?.costs ?? {})
            setTaxDisclaimer(
              typeof packData?.taxDisclaimer === 'string' ? packData.taxDisclaimer : null
            )
          } else {
            toast.error(copy.packsLoadFailed)
          }
        }

        const autoReloadRes = await fetch('/api/credits/auto-reload', { cache: 'no-store' })
        if (!cancelled && autoReloadRes.ok) {
          const autoReloadData = await autoReloadRes.json()
          setAutoReload(autoReloadData as AutoReloadPreferenceDTO)
        }

        if (!cancelled) {
          await refreshCredits()
        }
      } catch {
        if (!cancelled) toast.error(copy.creditsLoadFailed)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPage()

    return () => {
      cancelled = true
    }
  }, [searchParams, router, refreshCredits, copy])

  const handleAutoReloadToggle = async (enabled: boolean) => {
    setAutoReloadSaving(true)
    setAutoReloadMessage(null)
    try {
      const res = await fetch('/api/credits/auto-reload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, packSize: autoReload?.packSize ?? 100 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAutoReloadMessage(
          typeof data?.error === 'string'
            ? data.error
            : copy.autoReloadDefaultError
        )
        return
      }
      setAutoReload(data as AutoReloadPreferenceDTO)
      setAutoReloadMessage(
        enabled
          ? copy.autoReloadEnabled
          : copy.autoReloadDisabled
      )
    } catch {
      setAutoReloadMessage(copy.autoReloadUpdateFailed)
    } finally {
      setAutoReloadSaving(false)
    }
  }

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (res.ok && data?.url) {
        window.location.href = data.url
      } else if (res.status === 503) {
        toast.error(copy.checkoutUnavailable)
      } else {
        toast.error(data?.error ?? copy.checkoutStartFailed)
      }
    } catch {
      toast.error(copy.checkoutStartFailed)
    } finally {
      setPurchasing(null)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'grant': return <Gift className="h-4 w-4 text-green-500" />
      case 'purchase': return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      case 'consumption': return <ArrowDownRight className="h-4 w-4 text-orange-500" />
      case 'auto_reload': return <Zap className="h-4 w-4 text-purple-500" />
      default: return <Coins className="h-4 w-4" />
    }
  }

  const signedAmount = (tx: CreditTransactionClient): number => {
    const amount = tx.amount ?? 0
    return tx.type === 'consumption' ? -Math.abs(amount) : Math.abs(amount)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {copy.pageIntro}
          </p>
        </div>
      </FadeIn>

      {/* Balance Card */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{copy.currentBalance}</p>
                <p className="text-4xl font-bold font-mono mt-1">{balance !== null ? balance : '...'}</p>
                {(balance ?? 0) < 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{copy.negativeBalance}</span>
                  </div>
                )}
                {graceUsed && (balance ?? 0) <= 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {copy.graceUsed}
                  </p>
                )}
              </div>
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Coins className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Auto-reload */}
      <FadeIn delay={0.12}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              {copy.autoReloadTitle}
            </CardTitle>
            <CardDescription>
              {copy.autoReloadDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="auto-reload-toggle" className="text-sm">
                {copy.autoReloadToggle}
              </Label>
              <Switch
                id="auto-reload-toggle"
                checked={autoReload?.enabled ?? false}
                disabled={autoReloadSaving || loading}
                onCheckedChange={(checked) => void handleAutoReloadToggle(checked)}
              />
            </div>
            {!autoReload?.hasSavedPaymentMethod && (
              <p className="text-sm text-muted-foreground">
                {copy.savePaymentHint}
              </p>
            )}
            {autoReloadMessage && (
              <p className="text-sm text-amber-700">{autoReloadMessage}</p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Credit Packs */}
      <FadeIn delay={0.15}>
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">{copy.addCreditsTitle}</h2>
          {taxDisclaimer && (
            <p className="text-sm text-muted-foreground">{taxDisclaimer}</p>
          )}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {copy.loadingPacks}
              </CardContent>
            </Card>
          ) : (packs?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {copy.noPack}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(packs ?? []).map((pack: CreditPack) => (
                <Card key={pack.id} className="relative hover:shadow-md transition-shadow">
                  {pack.id === 'pack_200' && (
                    <Badge className="absolute -top-2.5 right-4 bg-primary">{copy.popular}</Badge>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg">{pack.label}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">€{pack.priceEur}</span>
                      <span className="text-muted-foreground ml-1">{copy.forCredits} {pack.size} {copy.credits}</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {copy.digitalCreditsInfo}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      variant={pack.id === 'pack_200' ? 'default' : 'outline'}
                      onClick={() => handlePurchase(pack.id)}
                      loading={purchasing === pack.id}
                      disabled={!!purchasing}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {copy.buyCredits} {pack.size} {copy.credits}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Cost Reference */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">{copy.creditCostsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: copy.costClarification, cost: costs?.clarification ?? 1 },
                { label: copy.costDecision, cost: costs?.decision ?? 3 },
                { label: copy.costMiniForm, cost: costs?.mini_form ?? 5 },
                { label: copy.costPrdGen, cost: costs?.prd_generation ?? 10 },
                { label: copy.costPrdChallenge, cost: costs?.prd_challenge ?? 15 },
              ].map((item: { label: string; cost: number }) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{item.label}</span>
                  <Badge variant="secondary" className="font-mono">{item.cost}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">{copy.transactionsTitle}</h2>
        {(transactions?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {copy.noTransactions}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {(transactions ?? []).map((tx) => {
                  const amt = signedAmount(tx)
                  const isPositive = amt > 0
                  return (
                  <div key={tx?.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx?.type)}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {tx?.type === 'consumption' ? (tx?.operationType ?? copy.usage) : tx?.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx?.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-medium ${
                        isPositive ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isPositive ? '+' : ''}{amt}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {copy.balanceShort}: {tx?.balanceAfter ?? 0}
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

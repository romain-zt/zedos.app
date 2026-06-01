export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCreditPacks, getCreditCosts } from '@/lib/config'
import {
  checkoutTaxDisclaimer,
  isStripeAutomaticTaxEnabled,
} from '@infrastructure/payments/checkout-tax-legibility'
import { CreditPacksResponseSchema } from '@repo/contracts/payments'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'credits/packs' })

export async function GET() {
  try {
    const automaticTaxEnabled = isStripeAutomaticTaxEnabled()
    const payload = {
      packs: getCreditPacks(),
      costs: getCreditCosts(),
      taxDisclaimer: checkoutTaxDisclaimer(automaticTaxEnabled),
      automaticTaxEnabled,
    }
    const parsed = CreditPacksResponseSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid packs payload' }, { status: 500 })
    }
    return NextResponse.json(parsed.data)
  } catch (error: unknown) {
    logger.error('Credits packs GET failed', error)
    return NextResponse.json({ error: 'Failed to load credit packs' }, { status: 500 })
  }
}

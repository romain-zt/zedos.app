export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { getCreditPacks } from '@/lib/config'
import { CreateCheckoutSessionRequestSchema } from '@repo/contracts/payments'
import { createCheckoutSessionForUser } from '@infrastructure/payments/stripe-checkout-flows'
import { createLogger } from '@shared/observability/logger'
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events'
import { captureServer } from '@infrastructure/analytics/posthog-server'

const logger = createLogger({ operation: 'stripe/checkout' })

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}

export async function POST(request: NextRequest) {
  let userId: string | undefined
  let packId: string | undefined

  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

    const parsedBody = CreateCheckoutSessionRequestSchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 })
    }
    packId = parsedBody.data.packId

    const result = await createCheckoutSessionForUser({
      userId,
      packId,
      origin: request.headers.get('origin') ?? '',
      packs: getCreditPacks(),
    })

    if (result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    captureServer(AnalyticsEvents.CREDIT_PACK_CHECKOUT_STARTED, userId, {
      pack_id: packId,
    })
    return NextResponse.json(result.value)
  } catch (error: unknown) {
    logger.withContext({ userId, packId }).error('Stripe checkout failed', error)
    return NextResponse.json({ error: errorMessage(error, 'Checkout failed') }, { status: 500 })
  }
}
